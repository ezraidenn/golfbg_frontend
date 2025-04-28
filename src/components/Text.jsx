// InfoText.jsx
import React from "react";

const styles = {
  text: {
    color: "#030303",
    fontSize: "14px",
    fontFamily: "Poppins",
    lineHeight: "20px",
    marginBottom: "4px",
  },
};

const InfoText = ({ text }) => {
  return <div style={styles.text}>{text}</div>;
};

export default InfoText;
