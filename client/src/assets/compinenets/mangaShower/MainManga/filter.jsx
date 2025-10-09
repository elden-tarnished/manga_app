import { useContext, useMemo } from "react";
import { FilterContext} from "./context.js";
import { FilterButton } from "./button";
import './css/filter.css';

export function Filter({FilterOptions}) {
  const {
    genre,
    theme,
    explicitGenre,
    demographic,
    type,

    order,
    limit,
    direction,

    //setters:

    setGenre,
    setTheme,
    setExplicitGenre,
    setDemographic,
    setType,

    setOrder,
    setLimit,
    setDirection
  } = useContext(FilterContext);

  const setter = {
    genre: setGenre,
    theme: setTheme,
    demographic: setDemographic,
    type: setType,
    explicitGenre: setExplicitGenre
  }
  const limits = ['25', '50', '60', '100', '200']
  const directionValues = ['ASC', 'DESC'];
  const filtersKeys = Object.keys(FilterOptions).filter(e => e !== 'validOrder');

  // const limitOrderDirectionCurrents = useMemo(() => {
  //   return (new Set([...genre, ...theme, ...explicitGenre, ...demographic, ...type]));
  // }, [genre, theme, explicitGenre, demographic, type]); 

  const tagCurrents = useMemo(() => [genre,theme,demographic,type,explicitGenre],
  [genre,theme,demographic,type,explicitGenre]);

  const selectedValuesSetter = useMemo(() => {
    return {
    genre: tagCurrents[0],
    theme: tagCurrents[1],
    demographic: tagCurrents[2],
    type: tagCurrents[3],
    explicitGenre: tagCurrents[4],}
  }, [tagCurrents])

  const orderButtons = useMemo(() => {
    return FilterOptions.validOrder.map(item =>
       <FilterButton key={item} value={item} selectedValues={order} setter={setOrder} filterType={'order'}></FilterButton>
    )
  }, [order]);
  const limitButtons = useMemo(() => {
    return limits.map(item => 
      <FilterButton key={item} value={item} selectedValues={limit} setter={setLimit} filterType={'limit'}></FilterButton>
    )
  }, [limit]);
  const directionButtons = useMemo(() => {
    return directionValues.map(item => 
      <FilterButton key={item} value={item} selectedValues={direction} setter={setDirection} filterType={'direction'}></FilterButton>
    )
  }, [direction])
  
  const tagButtons = useMemo(() => {
    return (filtersKeys.map((key) => 
    (<div key={key} className={`${key}__container`}>
      <h1 className={`filter__title ${key}`}>{key}</h1>
      <div className={`${key}-btn__container`}>
      {FilterOptions[key].map( item => 
      (<FilterButton 
        key={`${key}-${item}`} 
        value={item}
        selectedValues={selectedValuesSetter[key]}
        setter={setter[key]}
        filterType={key}
        >
      </FilterButton>))}
      </div>
    </div>)))
  }, [tagCurrents])

  return (
    <div className="filter__container">

      <div className={'filter--horizontal__container'}>
        <button className={"filter__expand"}>exp</button>
        <div className="order__container">
          <h1 className={'filter__title'}>Order</h1>
          <div className="order-btn__container">{orderButtons}</div>
        </div>

        <div className="limit__container">
          <h1 className={'filter__title'}>Limit</h1>
          <div className="limit-btn__container">{limitButtons}</div>
        </div>

        <div className="direction__container">
          <h1 className={'filter__title'}>direction</h1>
          <div className="direction-btn__container">{directionButtons}</div>
        </div>

      </div>

      <div className="tags__container">{tagButtons}</div>
      <button className={"btn"} style={{borderRadius: '16px', margin: '5px'}}>Done</button>
    </div>
  );
}