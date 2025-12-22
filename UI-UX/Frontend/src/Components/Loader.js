import React from "react"
import { Spinner } from "react-bootstrap"
import { faCircleNotch } from '@fortawesome/free-solid-svg-icons'  
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"

const Loader = () => {
  return (
    <Spinner
      animation='border'
      role='status'
      style={{
        width: "100px",
        height: "100px",
        margin: "auto",
        display: "block",
      }}
    >
      <span className='sr-only'>Loading <FontAwesomeIcon icon={faCircleNotch} spin /></span>
    </Spinner>
  )
}

export default Loader
