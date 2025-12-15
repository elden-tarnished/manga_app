import { SearchBar } from "./SearchBar/SearchBar.jsx"
import styles from "./Header.module.css"
import {UserIcon} from "./User/User.jsx";

export function Header() {
  return (
    <div className={styles.header__container}>
      <div className={styles.searchBar}>
        <SearchBar />
      </div>
      <div className={styles.user}><UserIcon /></div>
    </div>
  )
}
