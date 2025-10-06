import { useState, useEffect, useLayoutEffect, useRef} from "react";
import axios from 'axios';

const SearchBar = () => {
  const url = 'http://localhost:3000/';
  const [query, setQuery] = useState(null);
  const [result, setResult] = useState([]);
  const [loading, setLoading] = useState(false);

  const search = async() => {
    setLoading(true);
    if (query.trim() === '') return; 
    try {
      const response = axios.get(url);
      const result = response.data;
      setResult(result);
    } catch (err) {
      console.log('error at searchBar component: ', err);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {

  })
}

export default SearchBar;