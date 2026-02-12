import { useGSAP } from "@gsap/react"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import styles from "./Error.module.css"
import { useRef } from "react"
import { useState } from "react"

export function error({ error = { isActive: "false", message: "this is a fatal error" } }) {
  const errRef = useRef(null)

  useGSAP(() => {
    if (!error.isActive) return


  })

  return (
    <div ref={errRef} className={styles.err_container}>
      <h3>{error}</h3>
    </div>
  )
}
