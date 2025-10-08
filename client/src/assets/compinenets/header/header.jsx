import { SearchBar } from "./searchbar/SearchBar"
import styles from "./header.module.css"
export function Header() {
  return(
    <div className={styles.header__container}>
      <div className={styles.searchBar}>
        <SearchBar/>
      </div>
    </div>
)
}
