import { MangaContainer } from '../../components/Manga/MangaContainer.jsx'
import { Header } from '../../components/Header/Header.jsx'
import styles from './MangaPage.module.css'
import { IsMobileProvider } from '../../components/SmallComponents/IsMobileProvider.jsx'
import { Footer } from '../../components/Footer/Footer.jsx'
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
