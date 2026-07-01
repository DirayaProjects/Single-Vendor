import React, { useEffect, useState } from "react";
import "./deals.css";
import Header from "../../components/Header/header";
import Footer from "../../components/Footer/footer";
import { useStorefront } from "../../contexts/StorefrontContext";
import { useCart } from "../../contexts/CartContext";
import { fetchPromoAds } from "../../services/storefrontApi";
import { sizedImageUrl } from "../../services/uploadApi";

const DealsPage = () => {
  const { slug } = useStorefront();
  const { itemCount } = useCart();
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetchPromoAds(slug)
      .then((data) => { if (mounted) setAds(data); })
      .catch(() => { if (mounted) setAds([]); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [slug]);

  return (
    <div className="deals-layout">
      <Header cartCount={itemCount} />
      <div className="deals-page">
        <h1>Deals &amp; Promotions</h1>
        <p className="deals-intro">Only promotions with a link are clickable.</p>
        {loading ? (
          <p>Loading deals...</p>
        ) : ads.length === 0 ? (
          <p className="deals-empty">No active promotions right now.</p>
        ) : (
          <div className="deals-grid">
            {ads.map((ad) => (
              <DealCard key={ad.id} ad={ad} />
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

function DealCard({ ad }) {
  const image = sizedImageUrl(ad.image, "medium") || ad.image;
  const body = (
    <>
      {image && <img src={image} alt={ad.title} className="deal-image" />}
      <div className="deal-body">
        {ad.subtitle && <p className="deal-sub">{ad.subtitle}</p>}
        <h3>{ad.title}</h3>
        {ad.description && <p className="deal-desc">{ad.description}</p>}
        {ad.linkUrl && <span className="deal-hint">Click to open</span>}
      </div>
    </>
  );

  if (ad.linkUrl?.trim()) {
    const link = ad.linkUrl.trim();
    const external = /^https?:\/\//i.test(link);
    return (
      <a
        href={link}
        className="deal-card deal-card-link"
        target={external ? "_blank" : undefined}
        rel={external ? "noreferrer" : undefined}
      >
        {body}
      </a>
    );
  }

  return <article className="deal-card">{body}</article>;
}

export default DealsPage;
