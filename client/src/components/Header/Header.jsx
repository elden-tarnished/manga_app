import { SearchBar } from "./SearchBar/SearchBar.jsx"
import { UserIcon } from "./User/UserIcon.jsx";
import { Icon } from "./icon/icon.jsx"
import styles from "./Header.module.css"

export function Header() {
  return (
    <div className={styles.header__container}>
      <div className={styles.searchBar}><SearchBar /></div>
      <div className={styles.user}><UserIcon /></div>
      <div className={styles.logo}><Icon /></div>
    </div>
  )
}
