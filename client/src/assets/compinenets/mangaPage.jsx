import { MangaContainer } from './mangaShower/MainManga/MangaContainer'
import { Header } from './header/header'
import styles from './mangaPage.module.css'
import { IsMobileProvider } from './smallComponents/IsMobileProvider.jsx'
import { Footer } from './footer/footer.jsx'

export function MangaPage() {
  return (
    <IsMobileProvider brealpoint={768}>
      <div className={styles.container}>
        <Header></Header>
        <MangaContainer></MangaContainer>
        <Footer></Footer>
      </div>
    </IsMobileProvider>
  )
}
