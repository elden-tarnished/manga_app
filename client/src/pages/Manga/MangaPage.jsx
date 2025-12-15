import { MangaContainer } from '../../Components/Manga/MangaContainer.jsx'
import { Header } from '../../Components/Header/Header.jsx'
import styles from './MangaPage.module.css'
import { IsMobileProvider } from '../../Components/SmallComponents/IsMobileProvider.jsx'
import { Footer } from '../../Components/Footer/Footer.jsx'
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
