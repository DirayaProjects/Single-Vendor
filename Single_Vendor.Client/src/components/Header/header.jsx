import React, { useState, useEffect, useCallback } from "react";
import "./header.css";
import { FaSearch, FaShoppingBag, FaHeart, FaBars, FaTimes } from "react-icons/fa";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import AuthModal from "../AuthModal/AuthModal";
import { getUserToken } from "../../services/userAuth";
import { getAdminToken } from "../../services/adminAuth";
import { getSuperAdminToken } from "../../services/superAdminAuth";
import { useStoreSlug } from "../../hooks/useStoreSlug";
import { fetchStorefrontCategories, fetchStorefrontProducts, fetchStorefrontPromoAds } from "../../services/storefrontApi";
import { useCart } from "../../contexts/CartContext";
import { useStorefrontSettings } from "../../contexts/StorefrontSettingsContext";
import { promoAdHasContent } from "../../utils/promoAds";
import { resolveMediaUrl, resolveResponsiveMedia } from "../../utils/mediaUrl";

const LANG_STORAGE_KEY = "single_vendor_lang";

function readEmailFromJwt(token) {
  if (!token) return "";
  try {
    const payload = token.split(".")[1];
    if (!payload) return "";
    const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return (
      json?.email ||
      json?.["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"] ||
      ""
    );
  } catch {
    return "";
  }
}

const Header = () => {
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { slugFromUrl, apiSlug } = useStoreSlug();
  const { itemCount } = useCart();
  const { settings, features } = useStorefrontSettings();

  const hasSuperAdminSession = !!getSuperAdminToken();
  const hasAdminSession = !!getAdminToken();
  const hasCustomerSession = !!getUserToken();
  const [menuOpen, setMenuOpen] = useState(false);
  const [language, setLanguage] = useState(() => {
    try {
      const saved = localStorage.getItem(LANG_STORAGE_KEY);
      return saved === "Ar" ? "Ar" : "Eng";
    } catch {
      return "Eng";
    }
  });
  const [categories, setCategories] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [showDealsNav, setShowDealsNav] = useState(false);
  const [showNewNav, setShowNewNav] = useState(false);
  const logoUrl = settings?.logoUrl ? resolveMediaUrl(settings.logoUrl) : "";
  const logoResponsive = resolveResponsiveMedia(settings?.logoUrl || "");
  const activeToken = getUserToken() || getAdminToken() || getSuperAdminToken() || "";
  const activeEmail = readEmailFromJwt(activeToken);
  const avatarLetter = (activeEmail || "U").trim().charAt(0).toUpperCase();

  const selectedCategoryId = pathname === "/products" ? searchParams.get("categoryId") || "" : "";

  const loadCategories = useCallback(async () => {
    if (!apiSlug) {
      setCategories([]);
      return;
    }
    try {
      const list = await fetchStorefrontCategories(apiSlug);
      setCategories(Array.isArray(list) ? list : []);
    } catch {
      setCategories([]);
    }
  }, [apiSlug]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    let cancelled = false;
    if (!slugFromUrl || !apiSlug) {
      setShowDealsNav(false);
      setShowNewNav(false);
      return undefined;
    }
    (async () => {
      try {
        const [prods, ads] = await Promise.all([
          fetchStorefrontProducts(apiSlug),
          features.promoAdsSection ? fetchStorefrontPromoAds(apiSlug).catch(() => []) : Promise.resolve([]),
        ]);
        if (cancelled) return;
        const plist = Array.isArray(prods) ? prods : [];
        setShowNewNav(plist.length > 0);
        const alist = Array.isArray(ads) ? ads : [];
        const hasDeals = features.promoAdsSection && alist.some((a) => promoAdHasContent(a));
        setShowDealsNav(hasDeals);
      } catch {
        if (!cancelled) {
          setShowDealsNav(false);
          setShowNewNav(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slugFromUrl, apiSlug, features.promoAdsSection]);

  useEffect(() => {
    try {
      localStorage.setItem(LANG_STORAGE_KEY, language);
    } catch {
      // ignore storage restrictions
    }
    document.documentElement.lang = language === "Ar" ? "ar" : "en";
    document.documentElement.dir = language === "Ar" ? "rtl" : "ltr";
    document.body?.setAttribute("dir", language === "Ar" ? "rtl" : "ltr");
    window.dispatchEvent(new CustomEvent("singleVendor:languageChanged", { detail: { language } }));
  }, [language]);

  useEffect(() => {
    const onOpenAuth = (e) => {
      const mode = e.detail?.mode === "signup" ? "signup" : "login";
      setAuthMode(mode);
      setShowAuth(true);
    };
    window.addEventListener("singleVendor:openAuth", onOpenAuth);
    return () => window.removeEventListener("singleVendor:openAuth", onOpenAuth);
  }, []);

  useEffect(() => {
    if (pathname === "/products") {
      setSearchInput(searchParams.get("q") || "");
    }
  }, [pathname, searchParams]);

  const homeTo = slugFromUrl
    ? { pathname: "/", search: new URLSearchParams({ storeSlug: slugFromUrl }).toString() }
    : { pathname: "/" };

  const handleCategoryChange = (e) => {
    const id = e.target.value;
    const p = new URLSearchParams(search);
    if (id) p.set("categoryId", id);
    else p.delete("categoryId");
    navigate({ pathname: "/products", search: p.toString() });
    setMenuOpen(false);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const p = new URLSearchParams(search);
    if (searchInput.trim()) p.set("q", searchInput.trim());
    else p.delete("q");
    navigate({ pathname: "/products", search: p.toString() });
    setMenuOpen(false);
  };

  const openAuthModal = (mode) => {
    setAuthMode(mode);
    setShowAuth(true);
  };

  const goProductsView = (view) => {
    const p = new URLSearchParams(search);
    if (view) p.set("view", view);
    else p.delete("view");
    navigate({ pathname: "/products", search: p.toString() });
    setMenuOpen(false);
  };

  const openWishlist = () => {
    if (!features.wishlistFavorites) return;
    if (!hasCustomerSession) {
      openAuthModal("login");
      return;
    }
    goProductsView("wishlist");
  };

  const t = language === "Ar"
    ? {
        home: "الرئيسية",
        categories: "الفئات",
        deals: "العروض",
        whatsNew: "الجديد",
        login: "تسجيل الدخول",
        signup: "إنشاء حساب",
        myAccount: "حسابي",
        admin: "الإدارة",
        superAdmin: "سوبر أدمن",
        searchPlaceholder: "ابحث عن المنتجات…",
        languageEng: "الإنجليزية",
        languageAr: "العربية",
      }
    : {
        home: "Home",
        categories: "Categories",
        deals: "Deals",
        whatsNew: "What’s new",
        login: "Login",
        signup: "Sign Up",
        myAccount: "My account",
        admin: "Admin",
        superAdmin: "SuperAdmin",
        searchPlaceholder: "Search products…",
        languageEng: "Eng",
        languageAr: "Ar",
      };

  return (
    <>
      <header className="navbar">
        <div className="navbar-left">
          <Link to={homeTo} className="logo logo-link">
            {logoUrl ? (
              <img
                src={logoResponsive.src}
                srcSet={logoResponsive.srcSet || undefined}
                sizes="(max-width: 600px) 100px, 140px"
                alt={settings?.storeDisplayName || "Store logo"}
                className="logo-image"
              />
            ) : (
              "LOGO"
            )}
          </Link>

          <div className={`nav-links ${menuOpen ? "active" : ""}`}>
            <Link to={homeTo} className="nav-link">
              {t.home}
            </Link>
            <select className="dropdown-select" value={selectedCategoryId} onChange={handleCategoryChange}>
              <option value="">{t.categories}</option>
              {categories.map((c) => (
                <option key={c.categoryId} value={String(c.categoryId)}>
                  {c.name}
                </option>
              ))}
            </select>

            {showDealsNav && (
              <button type="button" className="nav-link nav-link-btn" onClick={() => goProductsView("deals")}>
                {t.deals}
              </button>
            )}
            {showNewNav && (
              <button type="button" className="nav-link nav-link-btn" onClick={() => goProductsView("new")}>
                {t.whatsNew}
              </button>
            )}
          </div>
        </div>

        <div className="navbar-center">
          <form className="search-container" onSubmit={handleSearchSubmit}>
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              className="search-input"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <button type="submit" className="search-submit" aria-label="Search">
              <FaSearch className="search-icon" />
            </button>
          </form>
        </div>

        <div className="navbar-right">
          {hasSuperAdminSession && (
            <Link to="/superadmin/dashboard" className="nav-btn">
              {t.superAdmin}
            </Link>
          )}
          {hasAdminSession && (
            <Link to="/admin/dashboard" className="nav-btn">
              {t.admin}
            </Link>
          )}
          {hasCustomerSession && !hasAdminSession && (
            <Link to={{ pathname: "/account", search }} className="nav-btn">
              {t.myAccount}
            </Link>
          )}
          {!hasSuperAdminSession && !hasAdminSession && !hasCustomerSession && (
            <>
              <button type="button" className="nav-btn" onClick={() => openAuthModal("login")}>
                {t.login}
              </button>
              <button type="button" className="nav-btn sign" onClick={() => openAuthModal("signup")}>
                {t.signup}
              </button>
            </>
          )}

          <select className="dropdown-select" value={language} onChange={(e) => setLanguage(e.target.value)}>
            <option value="Eng">{t.languageEng}</option>
            <option value="Ar">{t.languageAr}</option>
          </select>

          {features.storefrontCartCheckout && (
            <Link to={{ pathname: "/cart", search }} className="cart-link-wrap">
              <FaShoppingBag className="nav-icon cart" style={{ cursor: "pointer" }} />
              {itemCount > 0 && <span className="cart-badge">{itemCount > 99 ? "99+" : itemCount}</span>}
            </Link>
          )}

          {features.wishlistFavorites && (
            <button type="button" className="wishlist-nav-btn" onClick={openWishlist} aria-label="Open wishlist">
              <FaHeart className="nav-icon" />
            </button>
          )}

          {(hasCustomerSession || hasAdminSession || hasSuperAdminSession) && (
            <div className="user-avatar user-avatar-initial" title={activeEmail || "Signed in"}>
              {avatarLetter}
            </div>
          )}

          <div className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} role="presentation">
            {menuOpen ? <FaTimes /> : <FaBars />}
          </div>
        </div>
      </header>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} mode={authMode} />}
    </>
  );
};

export default Header;
