
import { useUser } from '../../Context/UserContext.jsx';
import styles from './UserMenu.module.css';

export function UserMenu({ onLogout }) {
  const { user, logout } = useUser();

  const handleChangeInfo = () => {
    console.log('Navigate to user profile settings');
    // navigate('/profile');
  };

  const handleFavorites = () => {
    console.log('Navigate to favorites');
    // navigate('/favorites');
  };

  const handleLogout = async () => {
    try {
      const response = await fetch('http://localhost:3000/user/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Note: fetch doesn't send cookies by default unless credentials: 'include' is set
          // However, since the cookie is httpOnly and same-site might be lax/strict, 
          // ensure credentials are included if using fetch.
        },
        credentials: 'include' 
      });

      if (response.ok) {
        console.log('User logged out');
        logout(); // Update global context
        if (onLogout) onLogout();
      } else {
        console.error('Logout failed');
      }
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  return (
    <div className={styles.userMenuContainer}>
      <div className={styles.userAvatar} >
        <div className={styles.userName}>Hello {user?.username}</div>
      </div>

      <div className={styles.userMenuButtons}>
        <button onClick={handleChangeInfo} className={styles.menuItem}>
          Change Info
        </button>
        <button onClick={handleFavorites} className={styles.menuItem}>
          Favorites
        </button>
        <button onClick={handleLogout} className={`${styles.menuItem} ${styles.logoutBtn}`}>
          Logout
        </button>
      </div>
    </div>
  );
}