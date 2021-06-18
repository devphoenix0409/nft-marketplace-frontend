import { useHistory, useParams, useIntl } from 'umi';
import { useEffect, useState } from 'react';
import { notification } from 'antd';
import { useWallet } from '@binance-chain/bsc-use-wallet';
import AssetInfo from '@/components/asset-info';
import OffersTable from '@/components/offers-table';
import { queryDetail, queryOrder, queryMintToken } from '@/servers';
import { dataToDetailProps, transResource } from '@/helpers/data-to-props';
import BuyConfirm from '@/components/buy-confirm';
import SendAddress from '@/components/send-address';

import {
  buyToken,
  sendToken,
  sellToken,
  sellTokenCancel,
} from '@/helpers/treasureland';
import SellConfirm from '@/components/sell-confirm';
import Web3 from 'web3';
import contractFactory from '@/contracts';

const approvedAddress = '0x2011e906491500a69c8f83ebe0cbebf4126bb536';
const tlContract = '0xf7a21ffb762ef2c14d8713b18f5596b4b0b0490a';

export default () => {
  const intl = useIntl();
  const { contract, tokenId, orderId } = useParams() as any;
  const wallet = useWallet();
  const history = useHistory();
  const [detail, setDetail] = useState<any>(null);
  const [order, setOrder] = useState(null);
  const [sellLoading, setSellLoading] = useState(false);
  const [cancelSellLoading, setCancelSellLoading] = useState(false);
  const [visible, setVisivle] = useState(false);
  const [price, setPrice] = useState(0);
  const [isMyOrder, setIsMyOrder] = useState(false);
  const [isOnSale, setIsOnSale] = useState(false);
  const [buyConfirm, setBuyConfirm] = useState({
    visible: false,
    isCompleting: false,
  });
  /** send */
  const [sendAddress, setSendAddress] = useState({
    visible: false,
    address: '',
    sendLoading: false,
  });

  useEffect(() => {
    initDetailData(tokenId, contract);
    if (orderId) {
      initOrderData(orderId);
    }
  }, [tokenId]);

  /** 是否是我的单子 */
  useEffect(() => {
    ownerOfme(tokenId);
  }, [wallet.status]);

  /** 是否在售 */
  useEffect(() => {
    if (orderId) {
      setIsOnSale(true);
    }
  }, [orderId]);

  /**
   * 系列：使用ownerOf判断
   * 个人铸造：is_mint === 0 &&  wallet.account === detail.creator
   * 个人铸造：is_mint === 1 && ownerOf()
   * @param tokenId
   */
  const ownerOfme = async (tokenId: string) => {
    if (wallet.status === 'connected') {
      if (detail && detail.is_mint === 0) {
        setIsMyOrder(
          wallet.account?.toLocaleLowerCase() ===
            detail.creator?.toLocaleLowerCase(),
        );
      } else {
        const contractObj = await contractFactory(contract);
        try {
          contractObj.methods
            .ownerOf(tokenId)
            .call()
            .then((owner: string) => {
              setIsMyOrder(owner === wallet.account);
            })
            .catch((error: any) => {
              console.error(error);
            });
        } catch (error) {
          console.error(error);
        }
      }
    }
  };

  const initDetailData = async (id: string, contract: string) => {
    try {
      if (contract === tlContract) {
        const data: any = await queryMintToken(id);
        setDetail(data);
      } else {
        const data: any = await queryDetail(id, contract);
        setDetail(data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const initOrderData = async (id: string) => {
    try {
      const data: any = await queryOrder(id);
      setOrder(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleBuy = async () => {
    if (wallet.status !== 'connected') {
      notification.info({
        message: intl.formatMessage({
          id: 'notify_connectWallet',
          defaultMessage: 'Connect wallet',
        }),
      });
      return;
    }

    // setBuyLoading(true);
    setBuyConfirm({
      ...buyConfirm,
      visible: true,
    });
  };

  const inputSendAddress = async () => {
    if (wallet.status === 'connected') {
      setSendAddress({
        ...sendAddress,
        visible: true,
        sendLoading: true,
      });
    } else {
      notification.info({
        message: intl.formatMessage({
          id: 'notify_connectWallet',
          defaultMessage: 'Connect wallet',
        }),
      });
    }
  };

  const handleOk = async () => {
    setVisivle(false);

    setSellLoading(true);

    try {
      const maker = wallet.account || '';
      const _tokenId = detail.token_id || (tokenId as string);
      const target = detail.contract || tlContract;

      console.log({ maker, price, _tokenId, amount: 1, target });
      const res = await sellToken({
        maker,
        price,
        tokenId: _tokenId,
        amount: 1,
        target,
      });

      console.log('res', res);
      const orderId = res.ID;

      setSellLoading(false);
      history.push(`/market/${contract}/${_tokenId}/${orderId}`);
    } catch (error) {
      const { code, message } = error;
      // 4001 用户拒绝
      if (code !== 4001) {
        notification.error({
          message,
        });
      }

      console.log('error', error);
      setSellLoading(false);
    }
  };

  const handleCancel = () => {
    setVisivle(false);
  };

  const handleCancelSell = async () => {
    setCancelSellLoading(true);

    try {
      await sellTokenCancel(order);
      setCancelSellLoading(false);
      history.push(`/market/${contract}/${tokenId}`);
    } catch (error) {
      console.error(error);
      setCancelSellLoading(false);
    }
  };

  const handleBuyConfirmOk = async () => {
    setBuyConfirm({
      ...buyConfirm,
      isCompleting: true,
    });

    try {
      const result = await buyToken(order, wallet.account as string, 1);
      // const { contract, token_id } = result;
      console.log('buyToken result: ', result);

      notification.success({
        message: intl.formatMessage({
          id: 'notify_buySuccess',
          defaultMessage: 'Buy success',
        }),
      });
      history.push(`/market/${contract}/${tokenId}`);

      setBuyConfirm({
        ...buyConfirm,
        visible: false,
        isCompleting: false,
      });
    } catch (error) {
      setBuyConfirm({
        ...buyConfirm,
        visible: false,
        isCompleting: false,
      });
    }
  };

  const handleBuyConfirmCancel = () => {
    setBuyConfirm({
      ...buyConfirm,
      visible: false,
    });
  };

  /** send */
  const handleAddressChange = (address: string) =>
    setSendAddress({
      ...sendAddress,
      address,
    });

  const handleSendAddressOk = async () => {
    setSendAddress({
      ...sendAddress,
      visible: false,
    });

    if (!detail || !wallet.account) return;

    try {
      const result = await sendToken(
        wallet.account,
        sendAddress.address,
        detail.token_id || tokenId,
        contract,
      );
      console.log('result', result);

      setSendAddress({
        ...sendAddress,
        visible: false,
        sendLoading: false,
      });

      ownerOfme(tokenId);
    } catch (error) {
      setSendAddress({
        ...sendAddress,
        visible: false,
        sendLoading: false,
      });
      console.error(error);
    }
  };

  const handleSendAddressCancel = () => {
    setSendAddress({
      ...sendAddress,
      visible: false,
      sendLoading: false,
    });
  };

  const handleCheck = async () => {
    if (wallet.status !== 'connected') {
      notification.info({
        message: intl.formatMessage({
          id: 'notify_connectWallet',
          defaultMessage: 'Connect wallet',
        }),
      });
    } else {
      try {
        console.log(wallet.account, approvedAddress);
        const contractObj = await contractFactory(contract);
        console.log('contractObj', contractObj);
        const isApproved = await contractObj.methods
          .isApprovedForAll(wallet.account, approvedAddress)
          .call();
        if (isApproved) {
          setVisivle(true);
        } else {
          contractObj.methods.setApprovalForAll(approvedAddress, true).send({
            from: wallet.account,
          });
        }
      } catch (error) {
        console.error(error);
      }
    }
  };

  return (
    <>
      {!!detail && (
        <AssetInfo
          {...dataToDetailProps(detail, tokenId)}
          buyLoading={buyConfirm.isCompleting}
          sendLoading={sendAddress.sendLoading}
          sellLoading={sellLoading}
          cancelSellLoading={cancelSellLoading}
          isMyOrder={isMyOrder}
          isOnSale={isOnSale}
          onBuy={handleBuy}
          onSend={inputSendAddress}
          onSell={handleCheck}
          onCancelSell={handleCancelSell}
        />
      )}
      {/* <OffersTable dataSource={[]} /> */}
      <SellConfirm
        visible={visible}
        onChange={setPrice}
        onOk={handleOk}
        onCancel={handleCancel}
        priceSymbol="BNB"
      />

      {!!detail && (
        <BuyConfirm
          visible={buyConfirm.visible}
          onOk={handleBuyConfirmOk}
          onCancel={handleBuyConfirmCancel}
          name={detail.name}
          title={detail.collect_name}
          image={transResource(detail.image)}
          volume={1}
          amount={Web3.utils.fromWei(detail.price || '0')}
          symbol="BNB"
          isCompleting={buyConfirm.isCompleting}
        />
      )}

      <SendAddress
        visible={sendAddress.visible}
        address={sendAddress.address}
        onChange={handleAddressChange}
        onOk={handleSendAddressOk}
        onCancel={handleSendAddressCancel}
      ></SendAddress>
    </>
  );
};
