import { useGSAP } from "@gsap/react";
import styles from "./icon.module.css";
import gsap from "gsap";
import { useRef } from "react";
import { Observer } from "gsap/Observer";
import { useNavigate } from "react-router";
import { useIsMobile } from "../../SmallComponents/IsMobileProvider";

const mainPath = "M14.3643 10.3371C15.9576 7.56018 16.7542 6.17174 17.7202 5.5852C19.1208 4.73476 20.8792 4.73476 22.2798 5.5852C23.2458 6.17174 24.0424 7.56018 25.6357 10.3371L34.2431 25.3389C35.821 28.0892 36.61 29.4643 36.6308 30.5879C36.661 32.2169 35.7842 33.7282 34.3541 34.512C33.3678 35.0526 31.781 35.0526 28.6074 35.0526H11.3926C8.21901 35.0526 6.63222 35.0526 5.6459 34.512C4.21584 33.7282 3.339 32.2169 3.36918 30.5879C3.38999 29.4643 4.17898 28.0892 5.75694 25.3389L14.3643 10.3371Z";
const first = "M0 0 L40 0 L40 40 L0 40 Z"

export function Icon() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  gsap.registerPlugin(Observer);
  const svgRef = useRef(null);
  const containerRef = useRef(null)
  const pathRef = useRef(null);
  const titleRef = useRef(null);

  useGSAP(() => {
    if (isMobile) return
    const tl = gsap.timeline({
      paused: true, defaults: {
        transformOrigin: "50% 50%",
      }
    })
      .to(pathRef.current, {
        morphSVG: {
          origin: "50 50",
          shape: first
        },
        ease: "none",
        duration: 0.2,
      })
      .to(svgRef.current, {
        x: 60,
        y: 3,
        skewX: -20,
        scaleX: 3.4,
        zIndex: -1,
      }, "<")
      .to(titleRef.current, {
        color: "#F0E4D3"
      }, 0)

    Observer.create({
      target: containerRef.current,
      type: "pointer",
      onHover: () => {
        tl.play()
      },
      onHoverEnd: () => {
        tl.reverse()
      },
      onClick: () => {
        navigate("/")
      }
    })
  }, { dependencies: [isMobile] })

  return (
    <div className={styles.container} ref={containerRef}>
      <div>
        <svg
          ref={svgRef}
          className={`${styles.svg}`}
          width="40" height="40"
          fill={"black"}
          viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
          <path
            ref={pathRef}
            d={mainPath}
            strokeLinecap="round"
            shapeRendering="auto"

          />
        </svg>
      </div>
      <h3 className={styles.title} ref={titleRef} j>mangaso</h3>
    </div >
  )
}
