
import React from "react";
import "./footer.css";



const Footer = () => {  


return (<footer className="footer">
        <div className="footer-left">
          <h4>Website</h4>
          <p>copyright © 2025</p>
        </div>
        <div className="footer-right">
          <p>Follow Us</p>
          <div className="social-icons">
            <i className="fab fa-youtube"></i>
            <i className="fab fa-facebook"></i>
            <i className="fab fa-instagram"></i>
          </div>
        </div>
      </footer>);
};
export default Footer;