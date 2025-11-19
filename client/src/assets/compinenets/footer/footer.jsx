import styles from './footer.module.css'
export function Footer() {
  return (
    <div>
      <div>
        <h3 >Contacts & Socials</h3>
        <ul>
          <li><a href='' >Contact Me</a></li>
          <li><a href='' >Telegram</a></li>
          <li><a href='' >Github</a></li>
        </ul>
      </div>
      <div>
        <ul>
          <li><a href="">DMCA Notice</a></li>
          <li><a href="">Privacy Policy</a></li>
          <li><a href="">Terms of Service</a></li>
        </ul>
      </div>
      <p className={styles.year}>© [Year] [Your Site/Name]. All rights reserved. Manga data courtesy of MyAnimeList.net—used under their terms. This is an unofficial fan site.</p>
    </div>
  )
}
