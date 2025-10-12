import { useContext } from "react";
import {FilterContext} from "./context.js";
import styles from './css/pagination.module.css';

export function Pagination({maxPageNum}) {
  const {page, setPage} = useContext(FilterContext);
  const offset = 1;

  const startPage = Math.max(1, (page - offset));
  const endPage = Math.min(maxPageNum, (page + offset));



  const PageButtons =
  Array.from({length: (endPage - startPage + 1)}, (_, i) => {
    const pageNum =  startPage + i;
    const isSelected = (page === pageNum) ? 'pagination__isSelected' : '';
      return(
      <button onClick={() => setPage(pageNum)} className={`${isSelected} ${styles.button}`} key={pageNum}>{pageNum}</button>
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
          default: console.log('ERROR: some kinda error in pagination')
          break;
      }
    }
  

  return(
    <div className={styles.container}>
      <button className={styles.button} onClick={ () => lastFirstBehavior('prev')}> 	&lt;</button>
      {page - offset > 1 && <button className={styles.button} onClick={() => lastFirstBehavior('first')}>1</button>}
      {page - offset > 1 && <h1 >...</h1 >}
      {PageButtons}
      {page + offset < maxPageNum && <h1 >...</h1>}
      {page + offset < maxPageNum && <button className={styles.button} onClick={() => lastFirstBehavior('last')}>{maxPageNum}</button>}
      <button className={styles.button} onClick={ () => lastFirstBehavior('next')}>&gt;</button>
    </div>
  )
}