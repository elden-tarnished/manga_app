import {MangaContainer} from './mangaShower/MainManga/MangaContainer'
import { Header } from './header/header'
import styles from './mangaPage.module.css'

export function MangaPage() {
  return(
    <div className={styles.container}>
      <Header></Header>
      <MangaContainer></MangaContainer>
    </div>
  )
}