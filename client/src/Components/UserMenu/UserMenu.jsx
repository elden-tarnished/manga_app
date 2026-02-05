import { useUser } from '../../Context/UserContext.jsx';
import styles from './UserMenu.module.css';
import { useRef, useState } from "react";
import { useNavigate } from 'react-router';
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin"
import { useIsMobile } from "../SmallComponents/IsMobileProvider.jsx";
import { ChangeInfo } from "./changeInfo/changeInfo.jsx";
import Popup from "../Popup/Popup.jsx";

export function UserMenu({ onLogout }) {
  gsap.registerPlugin(ScrambleTextPlugin, SplitText);
  const { user, logout } = useUser();
  const navigate = useNavigate();
  const container = useRef(null);
  const tl = useRef([])
  const tlClick = useRef(null);
  const layerTop = useRef(null);
  const layerBottom = useRef(null);
  const layerLeft = useRef(null);

  const buttonRef = useRef([]);
  const itemWrapperRef = useRef([]);
  const itemRef = useRef([]);
  const spanRef = useRef([]);
  const fillerRef = useRef([]);

  const isMobile = useIsMobile();
  const [showChangeInfo, setShowChangeInfo] = useState(false);
  const [activeItem, setActiveItem] = useState(null);
  const splitTextRef = useRef(null); // Store SplitText instance for cleanup
  const [showLogoutPopup, setShowLogoutPopup] = useState(false);

  function tlClickF(element) {
    // Create SplitText and store reference for later cleanup/reversal
    splitTextRef.current = SplitText.create(element, { type: "chars" });
    const chars = splitTextRef.current.chars;

    // Use fromTo for predictable reversible animation
    return gsap.timeline({ paused: true })
      .fromTo(chars,
        { y: 0, opacity: 1 },
        {
          stagger: 0.025,
          y: -80,
          opacity: 0,
          duration: 0.25,
          ease: "power2.in",
        }
      );
  }

  const handleChangeInfo = (e) => {
    setShowChangeInfo(true);
    setActiveItem(0);
    const target = e.currentTarget;
    tlClick.current = tlClickF(target);
    tlClick.current.play();
  };

  // Callback when ChangeInfo back animation completes - reverse the text animation
  const handleBackFromChangeInfo = () => {
    if (tlClick.current) {
      // Reverse with smooth timing
      tlClick.current.timeScale(1.5).reverse()
    }
  };

  useGSAP(() => {
    if (showChangeInfo) return;
    // Cleanup happens automatically via useGSAP context
  }, { dependencies: [showChangeInfo] });

  const handleFavorites = () => {
    navigate('/favorite');
  };

  const handleBackToManga = () => {
    navigate('/');
  };

  const handleLogout = () => {
    setShowLogoutPopup(true);
  };

  const confirmLogout = async () => {
    try {
      const response = await fetch('http://localhost:3000/user/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      if (response.ok) {
        console.log('User logged out');
        logout();
        setShowLogoutPopup(false);
        if (onLogout) onLogout();
      } else {
        console.error('Logout failed');
      }
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  const menuItems = [
    { label: "Change Info", color: "black", onClick: (e) => handleChangeInfo(e) },
    { label: "Favorites", color: "blue", onClick: handleFavorites },
    { label: "Logout", color: "red", onClick: handleLogout },
    { label: "Back to Manga", color: "green", onClick: handleBackToManga },
  ];

  const { contextSafe } = useGSAP(() => {



    menuItems.forEach((_, index) => {
      const item = itemRef.current[index]
      const span = spanRef.current[index]
      const button = buttonRef.current[index]
      const filler = fillerRef.current[index]

      const rect = filler.getBoundingClientRect();
      const spanRect = span.getBoundingClientRect()

      const itemChar = SplitText.create(item, { type: "chars" }).chars;
      const spanChar = SplitText.create(span, { type: "chars" }).chars;

      tl.current[index] = gsap.timeline({
        paused: true,
        onComplete: () => {
          // Disable pointer events on all other buttons when animation completes
          buttonRef.current.forEach((btn, i) => {
            if (i !== index && btn) {
              btn.style.pointerEvents = 'none';
            }
          });
        },
        onReverseComplete: () => {
          // Re-enable pointer events on all buttons when animation reverses
          buttonRef.current.forEach((btn) => {
            if (btn) {
              btn.style.pointerEvents = 'auto';
            }
          });
        }
      })
        .to(itemChar, {
          y: "var(--buttonHeight)",
          stagger: 0.02,
          duration: 0.5,
          ease: "power2.inOut",
        }, 0)
        .to([span, item], {
          zIndex: 12
        }, "<")
        .to(spanChar, {
          y: "7vh",
          stagger: 0.02,
          duration: 0.5,
          ease: "power2.inOut",
          fontWeight: 700,
        }, "<")
        .to(item, {
          display: "none",
          duration: 0,
        })
        .to(button, {
          duration: 0,
          overflow: "visible"
        })
        .set(filler, {
          position: "fixed",
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        }, 0)
        .to(filler, {
          left: 0,
          width: "100vw",
          duration: 0.6,
          ease: "expo.inOut",
          zIndex: 1,
          borderRadius: 0,
        }, 0)
      if (index === 2) {
        return
      }
      tl.current[index].to(filler, {
        height: "100vh",
        top: 0,
        zIndex: 10,
        backgroundColor: "#DCC5B2"
      })
        .set(span, {
          y: "calc(1 * var(--buttonHeight))",
          position: "fixed",
          top: spanRect.top,
          left: spanRect.left,
          width: spanRect.width,
          height: spanRect.height,
        }, "<")
        .to(span, {
          height: "0vh",
          top: "30vh"
        }, "<")
        .to(spanChar, {
          fontSize: isMobile ? 40 : 80,
          fontWeight: isMobile ? "300" : "400",
          stagger: 0.03,
          color: index === 3 ? "white" : "#000000",
          duration: 0.2,
        }, "<")

    })

  }, { dependencies: [isMobile] });
  const onMouseEnter = contextSafe((index) => {
    if (!tl.current[index]) return;
    tl.current[index].timeScale(1).play();

  })
  const onMouseLeave = contextSafe((index) => {
    if (!tl.current[index]) return;
    if (activeItem === index) return;
    tl.current[index].timeScale(2).reverse();
  })


  return (
    <div className={styles.userMenuContainer} ref={container}>
      <div className={styles.userAvatar}>
        <div className={styles.username}>Hello {user?.username}</div>
        <div className={styles.layerTop} ref={layerTop}></div>
        <div className={styles.layerLeft} ref={layerLeft}></div>
        <div className={styles.layerBotton} ref={layerBottom}></div>
      </div>

      <div className={styles.userMenuButtons}>
        {menuItems.map((item, index) => (

          <button
            key={index}
            onClick={item.onClick}
            onMouseEnter={() => onMouseEnter(index)}
            onMouseLeave={() => onMouseLeave(index)}
            className={`${styles.menuItem} ${index === 3 ? styles.manga : ""}`}
            ref={(el) => buttonRef.current[index] = el}
          >
            <span className={styles.span__container} ref={(el) => itemWrapperRef.current[index] = el}>
              <div className={`${styles.backgroundFiller} ${index === 3 ? styles.mangaFiller : ""}`} ref={(el) => fillerRef.current[index] = el}></div>
              <span className={styles.menuItemSpan} ref={(el) => spanRef.current[index] = el}>{item.label}</span>
              <span className={styles.item} ref={(el) => itemRef.current[index] = el}>{item.label}</span>
            </span>
          </button>
        ))}
      </div>
      <ChangeInfo
        isOpen={showChangeInfo}
        onClose={() => {
          setShowChangeInfo(false);
          setActiveItem(null);
          if (tl.current[0]) tl.current[0].timeScale(2).reverse();
        }}
        onBackAnimationComplete={handleBackFromChangeInfo}
      ></ChangeInfo>

      <Popup
        isOpen={showLogoutPopup}
        onClose={() => setShowLogoutPopup(false)}
        title="Confirm Logout"
      >
        {({ close }) => (
          <>
            <p>Are you sure you want to logout?</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button onClick={close} style={{ padding: '8px 16px', cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={confirmLogout} style={{ padding: '8px 16px', backgroundColor: '#e74c3c', color: 'white', border: 'none', cursor: 'pointer' }}>
                Logout
              </button>
            </div>
          </>
        )}
      </Popup>

    </div>
  );
}
