import { useContext } from "react";
import {FilterContext} from "./context.js";
import './css/Pagination.css';

export function Pagination({maxPageNum}) {
  const {page, setPage} = useContext(FilterContext);
  const offset = 5;

  const startPage = Math.max(1, (page - offset));
  const endPage = Math.min(maxPageNum, (page + offset));



  const PageButtons =
  Array.from({length: (endPage - startPage + 1)}, (_, i) => {
    const pageNum =  startPage + i;
    const isSelected = (page === pageNum) ? 'isSelected' : '';
      return(
      <button onClick={() => setPage(pageNum)} className={isSelected} key={pageNum}>{pageNum}</button>
    )})
    function lastFirstBehavior(type) {
      switch (type) {
        case 'first': 
          if (page === 1) return;
          setPage(1);
          break;
        case 'last': 
          if (page === maxPageNum) return;
          setPage(maxPageNum)
          break;
        case 'prev': 
          if (page === 1) return;
          setPage(page - 1)
          break;
        case 'next': 
          if (page === maxPageNum) return;
          setPage(page + 1)
          break; 
          default: console.log('ERROR: some kinda error in paginiation')
          break;
      }
    }
  

  return(
    <div>
      <button onClick={() => lastFirstBehavior('first')}>&lt;</button>
      <button onClick={ () => lastFirstBehavior('prev')}>prev</button>
      {PageButtons}
      <button onClick={ () => lastFirstBehavior('next')}>next</button>
      <button onClick={() => lastFirstBehavior('last')}>&gt;</button>
    </div>
  )
}