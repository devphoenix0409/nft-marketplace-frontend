import { useEffect, useState } from 'react';
import { useHistory } from 'umi';
import Header from '@/components/header';
import Banner from '@/components/banner';
import Market from '@/components/market';
import { queryItems } from '@/servers';
import web3 from 'web3';
import InfiniteScroll from 'react-infinite-scroller';
import Spin from '@/components/spin';
import { itemsToList } from '@/helpers/data-to-props';

export default () => {
  const hitory = useHistory();

  const [pagination, setPagination] = useState({
    dataCount: 0,
    pageNo: 0,
    pageSize: 18,
    hasMore: true,
  });
  const [list, setList] = useState([]);

  useEffect(() => {
    queryAssets(pagination.pageNo);
  }, []);

  const autoLoadAssets = (): void => {
    const currentPageNo = pagination.pageNo;
    const nextPageNo = currentPageNo + 1;

    queryAssets(nextPageNo);
  };

  /** 查询列表 */
  const queryAssets = async (page: number) => {
    try {
      const {
        list: newList,
        dataCount,
        pageNo,
        pageSize,
      }: any = await queryItems({
        pageNo: page,
        pageSize: pagination.pageSize,
      });

      setPagination({
        dataCount,
        pageNo,
        pageSize,
        hasMore: (pageNo + 1) * pageSize <= dataCount,
      });
      setList([...list, ...newList]);
    } catch (error) {
      console.error(error);
    }
  };

  const handleClick = (params: {
    contract: string;
    tokenId: string;
    orderId: string;
  }): void => {
    const { contract, tokenId, orderId } = params;
    hitory.push(`/market/${contract}/${tokenId}/${orderId}`);
  };

  return (
    <div>
      <Header />
      <Banner />
      <Market.LevelCheckbox onChange={() => {}} />

      <InfiniteScroll
        initialLoad={false}
        loadMore={autoLoadAssets}
        useWindow={true}
        hasMore={pagination.hasMore}
        loader={
          <div key={pagination.pageNo} style={{ textAlign: 'center' }}>
            <Spin />
          </div>
        }
      >
        <Market.CardList data={itemsToList(list)} onClick={handleClick} />
      </InfiniteScroll>
    </div>
  );
};
