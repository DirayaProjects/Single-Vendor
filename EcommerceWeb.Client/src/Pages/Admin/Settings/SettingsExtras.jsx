import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import "./settingsExtras.css";
import {
  FaTags,
  FaTruck,
  FaGift,
  FaPercent,
  FaSlidersH,
  FaEdit,
  FaTrash,
  FaPlus,
} from "react-icons/fa";
import { getPromoAds, createPromoAd, updatePromoAd, deletePromoAd } from "../../../services/promoAdsApi";
import { getDeliveryCities, createDeliveryCity, updateDeliveryCity, deleteDeliveryCity } from "../../../services/deliveryCitiesApi";
import { getSpinPrizes, createSpinPrize, updateSpinPrize, deleteSpinPrize } from "../../../services/spinWheelApi";
import { getGeneralDiscounts, createGeneralDiscount, updateGeneralDiscount, deleteGeneralDiscount } from "../../../services/generalDiscountsApi";
import { getProducts } from "../../../services/productsApi";
import { uploadImage } from "../../../services/uploadApi";

const emptyPromo = { title: "", subtitle: "", description: "", linkUrl: "", sortOrder: 0, isActive: true, image: "" };
const emptyCity = { name: "", deliveryFee: 0, sortOrder: 0, isActive: true };
const emptyPrize = { label: "", discountPercent: "", discountAmount: "", weight: 1, color: "#0f223d", sortOrder: 0, isActive: true };
const emptyDiscount = { name: "", discountPercent: "", discountAmount: "", isActive: true, productIds: [] };

const isNewId = (id) => String(id).startsWith("new-");

const SettingsExtras = forwardRef(function SettingsExtras({ features, onFeaturesChange }, ref) {
  const [tab, setTab] = useState("promo");
  const [promoAds, setPromoAds] = useState([]);
  const [cities, setCities] = useState([]);
  const [prizes, setPrizes] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [products, setProducts] = useState([]);
  const [deletedPromoIds, setDeletedPromoIds] = useState([]);
  const [deletedCityIds, setDeletedCityIds] = useState([]);
  const [deletedPrizeIds, setDeletedPrizeIds] = useState([]);
  const [deletedDiscountIds, setDeletedDiscountIds] = useState([]);
  const [promoForm, setPromoForm] = useState(emptyPromo);
  const [cityForm, setCityForm] = useState(emptyCity);
  const [prizeForm, setPrizeForm] = useState(emptyPrize);
  const [discountForm, setDiscountForm] = useState(emptyDiscount);
  const [editingPromoId, setEditingPromoId] = useState(null);
  const [editingCityId, setEditingCityId] = useState(null);
  const [editingPrizeId, setEditingPrizeId] = useState(null);
  const [editingDiscountId, setEditingDiscountId] = useState(null);
  const initialSnapshot = useRef(null);

  const loadAll = async () => {
    const [ads, cityList, prizeList, discountList, productList] = await Promise.all([
      getPromoAds(), getDeliveryCities(), getSpinPrizes(), getGeneralDiscounts(), getProducts(),
    ]);
    setPromoAds(ads);
    setCities(cityList);
    setPrizes(prizeList);
    setDiscounts(discountList);
    setProducts(productList);
    setDeletedPromoIds([]);
    setDeletedCityIds([]);
    setDeletedPrizeIds([]);
    setDeletedDiscountIds([]);
    initialSnapshot.current = {
      promos: JSON.stringify(ads),
      cities: JSON.stringify(cityList),
      prizes: JSON.stringify(prizeList),
      discounts: JSON.stringify(discountList),
    };
  };

  useEffect(() => { loadAll().catch(() => {}); }, []);

  const resetPromoForm = () => {
    setPromoForm(emptyPromo);
    setEditingPromoId(null);
  };

  const resetCityForm = () => {
    setCityForm(emptyCity);
    setEditingCityId(null);
  };

  const resetPrizeForm = () => {
    setPrizeForm(emptyPrize);
    setEditingPrizeId(null);
  };

  const resetDiscountForm = () => {
    setDiscountForm(emptyDiscount);
    setEditingDiscountId(null);
  };

  const stagePromo = (e) => {
    e.preventDefault();
    const dto = { ...promoForm, sortOrder: Number(promoForm.sortOrder) || 0 };
    if (editingPromoId) {
      setPromoAds((list) => list.map((a) => (a.id === editingPromoId ? { ...dto, id: editingPromoId } : a)));
    } else {
      setPromoAds((list) => [...list, { ...dto, id: `new-${Date.now()}` }]);
    }
    resetPromoForm();
  };

  const stageCity = (e) => {
    e.preventDefault();
    const dto = { ...cityForm, deliveryFee: Number(cityForm.deliveryFee), sortOrder: Number(cityForm.sortOrder) || 0 };
    if (editingCityId) {
      setCities((list) => list.map((c) => (c.id === editingCityId ? { ...dto, id: editingCityId } : c)));
    } else {
      setCities((list) => [...list, { ...dto, id: `new-${Date.now()}` }]);
    }
    resetCityForm();
  };

  const stagePrize = (e) => {
    e.preventDefault();
    const percentRaw = prizeForm.discountPercent !== "" && prizeForm.discountPercent != null
      ? Number(prizeForm.discountPercent) : null;
    const amountRaw = prizeForm.discountAmount !== "" && prizeForm.discountAmount != null
      ? Number(prizeForm.discountAmount) : null;
    const dto = {
      label: prizeForm.label,
      discountPercent: percentRaw != null ? percentRaw : (amountRaw == null ? 0 : null),
      discountAmount: amountRaw,
      weight: Number(prizeForm.weight) || 1,
      color: prizeForm.color || "#0f223d",
      sortOrder: Number(prizeForm.sortOrder) || 0,
      isActive: prizeForm.isActive,
    };
    if (editingPrizeId) {
      setPrizes((list) => list.map((p) => (p.id === editingPrizeId ? { ...dto, id: editingPrizeId } : p)));
    } else {
      setPrizes((list) => [...list, { ...dto, id: `new-${Date.now()}` }]);
    }
    resetPrizeForm();
  };

  const stageDiscount = (e) => {
    e.preventDefault();
    const dto = {
      name: discountForm.name,
      discountPercent: discountForm.discountPercent ? Number(discountForm.discountPercent) : null,
      discountAmount: discountForm.discountAmount ? Number(discountForm.discountAmount) : null,
      isActive: discountForm.isActive,
      productIds: discountForm.productIds.map(Number),
    };
    if (editingDiscountId) {
      setDiscounts((list) => list.map((d) => (d.id === editingDiscountId ? { ...dto, id: editingDiscountId } : d)));
    } else {
      setDiscounts((list) => [...list, { ...dto, id: `new-${Date.now()}` }]);
    }
    resetDiscountForm();
  };

  const removePromo = (id) => {
    if (!isNewId(id)) setDeletedPromoIds((ids) => [...ids, id]);
    setPromoAds((list) => list.filter((a) => a.id !== id));
    if (editingPromoId === id) resetPromoForm();
  };

  const removeCity = (id) => {
    if (!isNewId(id)) setDeletedCityIds((ids) => [...ids, id]);
    setCities((list) => list.filter((c) => c.id !== id));
    if (editingCityId === id) resetCityForm();
  };

  const removePrize = (id) => {
    if (!isNewId(id)) setDeletedPrizeIds((ids) => [...ids, id]);
    setPrizes((list) => list.filter((p) => p.id !== id));
    if (editingPrizeId === id) resetPrizeForm();
  };

  const removeDiscount = (id) => {
    if (!isNewId(id)) setDeletedDiscountIds((ids) => [...ids, id]);
    setDiscounts((list) => list.filter((d) => d.id !== id));
    if (editingDiscountId === id) resetDiscountForm();
  };

  const handlePromoImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const uploaded = await uploadImage(file, "settings");
    setPromoForm((f) => ({ ...f, image: uploaded.mediumUrl }));
  };

  const promoDto = (ad) => ({
    title: ad.title,
    subtitle: ad.subtitle || null,
    description: ad.description || null,
    image: ad.image || null,
    linkUrl: ad.linkUrl || null,
    buttonText: null,
    sortOrder: Number(ad.sortOrder) || 0,
    isActive: ad.isActive !== false,
  });

  const saveAllExtras = async () => {
    const snap = initialSnapshot.current;
    if (!snap) return;

    const promosChanged = deletedPromoIds.length > 0 || JSON.stringify(promoAds) !== snap.promos;
    const citiesChanged = deletedCityIds.length > 0 || JSON.stringify(cities) !== snap.cities;
    const prizesChanged = deletedPrizeIds.length > 0 || JSON.stringify(prizes) !== snap.prizes;
    const discountsChanged = deletedDiscountIds.length > 0 || JSON.stringify(discounts) !== snap.discounts;

    if (!promosChanged && !citiesChanged && !prizesChanged && !discountsChanged) {
      return;
    }

    if (promosChanged) {
      for (const id of deletedPromoIds) await deletePromoAd(id);
      for (const ad of promoAds) {
        const dto = promoDto(ad);
        if (isNewId(ad.id)) await createPromoAd(dto);
        else await updatePromoAd(ad.id, dto);
      }
    }

    if (citiesChanged) {
      for (const id of deletedCityIds) await deleteDeliveryCity(id);
      for (const city of cities) {
        const dto = {
          name: city.name,
          deliveryFee: Number(city.deliveryFee),
          sortOrder: Number(city.sortOrder) || 0,
          isActive: city.isActive !== false,
        };
        if (isNewId(city.id)) await createDeliveryCity(dto);
        else await updateDeliveryCity(city.id, dto);
      }
    }

    if (prizesChanged) {
      for (const id of deletedPrizeIds) await deleteSpinPrize(id);
      for (const prize of prizes) {
        const percentRaw = prize.discountPercent !== "" && prize.discountPercent != null
          ? Number(prize.discountPercent) : null;
        const amountRaw = prize.discountAmount !== "" && prize.discountAmount != null
          ? Number(prize.discountAmount) : null;
        const dto = {
          label: prize.label,
          discountPercent: percentRaw != null ? percentRaw : (amountRaw == null ? 0 : null),
          discountAmount: amountRaw,
          weight: Number(prize.weight) || 1,
          color: prize.color || "#0f223d",
          sortOrder: Number(prize.sortOrder) || 0,
          isActive: prize.isActive !== false,
        };
        if (isNewId(prize.id)) await createSpinPrize(dto);
        else await updateSpinPrize(prize.id, dto);
      }
    }

    if (discountsChanged) {
      for (const id of deletedDiscountIds) await deleteGeneralDiscount(id);
      for (const discount of discounts) {
        const dto = {
          name: discount.name,
          discountPercent: discount.discountPercent != null ? Number(discount.discountPercent) : null,
          discountAmount: discount.discountAmount != null ? Number(discount.discountAmount) : null,
          isActive: discount.isActive !== false,
          productIds: (discount.productIds || []).map(Number),
        };
        if (isNewId(discount.id)) await createGeneralDiscount(dto);
        else await updateGeneralDiscount(discount.id, dto);
      }
    }

    await loadAll();
  };

  useImperativeHandle(ref, () => ({ saveAllExtras }));

  const tabs = [
    { id: "promo", label: "Homepage Promos", icon: FaTags },
    { id: "cities", label: "Delivery Cities", icon: FaTruck },
    { id: "spin", label: "Spin Wheel", icon: FaGift },
    { id: "discounts", label: "Product Discounts", icon: FaPercent },
    { id: "features", label: "Store Features", icon: FaSlidersH },
  ];

  return (
    <div className="settings-extras">
      <div className="settings-card extras-intro-card">
        <div className="card-header">
          <FaSlidersH className="card-icon gold" />
          <h3>Store promotions &amp; checkout</h3>
        </div>
        <p className="extras-help">
          Configure promos, delivery, discounts, and feature toggles here. When you are done, click <strong>Save Changes</strong> below to apply everything to your store.
        </p>
      </div>

      <div className="settings-card extras-tabs-card">
        <div className="settings-tabs">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" className={tab === id ? "active" : ""} onClick={() => setTab(id)}>
              <Icon className="tab-icon" /> {label}
            </button>
          ))}
        </div>

        {tab === "promo" && (
          <div className="extras-panel">
            <p className="field-help panel-intro">
              The first <strong>3 active</strong> promos (lowest sort order) appear on your homepage in the pink highlight cards. Use <em>Subtitle</em> for the small label, <em>Title</em> for the large text, and <em>Description</em> for the line underneath.
            </p>

            <form onSubmit={stagePromo} className="extras-form">
              <div className="form-row two-col">
                <label className="field-block">
                  <span className="field-label">Subtitle <small>(e.g. FROM)</small></span>
                  <input value={promoForm.subtitle || ""} onChange={(e) => setPromoForm({ ...promoForm, subtitle: e.target.value })} placeholder="FROM" />
                </label>
                <label className="field-block">
                  <span className="field-label">Title * <small>(e.g. $12)</small></span>
                  <input required value={promoForm.title} onChange={(e) => setPromoForm({ ...promoForm, title: e.target.value })} placeholder="$12" />
                </label>
              </div>
              <label className="field-block">
                <span className="field-label">Description <small>(e.g. STARTING)</small></span>
                <input value={promoForm.description || ""} onChange={(e) => setPromoForm({ ...promoForm, description: e.target.value })} placeholder="STARTING" />
              </label>
              <label className="field-block">
                <span className="field-label">Link URL <small>(optional — card becomes clickable)</small></span>
                <input value={promoForm.linkUrl || ""} onChange={(e) => setPromoForm({ ...promoForm, linkUrl: e.target.value })} placeholder="https://..." />
              </label>
              <div className="form-row two-col">
                <label className="field-block">
                  <span className="field-label">Sort order <small>(lower = shown first)</small></span>
                  <input type="number" value={promoForm.sortOrder} onChange={(e) => setPromoForm({ ...promoForm, sortOrder: e.target.value })} />
                </label>
                <label className="field-block checkbox-field">
                  <input type="checkbox" checked={promoForm.isActive} onChange={(e) => setPromoForm({ ...promoForm, isActive: e.target.checked })} />
                  <span>Active on storefront</span>
                </label>
              </div>
              <label className="field-block">
                <span className="field-label">Image <small>(optional — used on Deals page)</small></span>
                <input type="file" accept="image/*" onChange={handlePromoImage} />
                {promoForm.image && <img src={promoForm.image} alt="" className="extras-preview-img" />}
              </label>
              <div className="form-actions">
                {editingPromoId && (
                  <button type="button" className="secondary-btn" onClick={resetPromoForm}>Cancel edit</button>
                )}
                <button type="submit" className="stage-btn">
                  <FaPlus /> {editingPromoId ? "Update in list" : "Add to list"}
                </button>
              </div>
            </form>

            <ListSection
              title="Your promos"
              empty="No promos yet. Add up to 3+ and save changes."
              items={promoAds}
              renderItem={(ad) => (
                <>
                  <strong>{[ad.subtitle, ad.title].filter(Boolean).join(" · ") || ad.title}</strong>
                  <span className="list-meta">{ad.isActive ? "Active" : "Inactive"} · Order {ad.sortOrder}</span>
                </>
              )}
              onEdit={(ad) => { setEditingPromoId(ad.id); setPromoForm({ ...ad, image: ad.image || "" }); }}
              onDelete={removePromo}
            />
          </div>
        )}

        {tab === "cities" && (
          <div className="extras-panel">
            <p className="field-help panel-intro">
              Customers choose a city at checkout. Set the delivery fee for each city.
            </p>
            <form onSubmit={stageCity} className="extras-form">
              <div className="form-row two-col">
                <label className="field-block">
                  <span className="field-label">City name *</span>
                  <input required value={cityForm.name} onChange={(e) => setCityForm({ ...cityForm, name: e.target.value })} placeholder="Beirut" />
                </label>
                <label className="field-block">
                  <span className="field-label">Delivery fee ($)</span>
                  <input type="number" step="0.01" value={cityForm.deliveryFee} onChange={(e) => setCityForm({ ...cityForm, deliveryFee: e.target.value })} />
                </label>
              </div>
              <div className="form-row two-col">
                <label className="field-block">
                  <span className="field-label">Sort order</span>
                  <input type="number" value={cityForm.sortOrder} onChange={(e) => setCityForm({ ...cityForm, sortOrder: e.target.value })} />
                </label>
                <label className="field-block checkbox-field">
                  <input type="checkbox" checked={cityForm.isActive} onChange={(e) => setCityForm({ ...cityForm, isActive: e.target.checked })} />
                  <span>Active</span>
                </label>
              </div>
              <div className="form-actions">
                {editingCityId && <button type="button" className="secondary-btn" onClick={resetCityForm}>Cancel edit</button>}
                <button type="submit" className="stage-btn"><FaPlus /> {editingCityId ? "Update in list" : "Add to list"}</button>
              </div>
            </form>
            <ListSection
              title="Delivery cities"
              empty="No cities added yet."
              items={cities}
              renderItem={(c) => (
                <>
                  <strong>{c.name}</strong>
                  <span className="list-meta">${Number(c.deliveryFee).toFixed(2)} delivery</span>
                </>
              )}
              onEdit={(c) => { setEditingCityId(c.id); setCityForm(c); }}
              onDelete={removeCity}
            />
          </div>
        )}

        {tab === "spin" && (
          <div className="extras-panel">
            <p className="field-help panel-intro">
              Define wheel segments and their discount. Enable the wheel under <strong>Store Features</strong>.
            </p>
            <form onSubmit={stagePrize} className="extras-form">
              <label className="field-block">
                <span className="field-label">Prize label *</span>
                <input required value={prizeForm.label} onChange={(e) => setPrizeForm({ ...prizeForm, label: e.target.value })} placeholder="10% OFF" />
              </label>
              <div className="form-row two-col">
                <label className="field-block">
                  <span className="field-label">Discount % <small>(use 0 for “Try again”)</small></span>
                  <input type="number" step="0.01" min="0" value={prizeForm.discountPercent} onChange={(e) => setPrizeForm({ ...prizeForm, discountPercent: e.target.value })} />
                </label>
                <label className="field-block">
                  <span className="field-label">Discount $</span>
                  <input type="number" step="0.01" value={prizeForm.discountAmount} onChange={(e) => setPrizeForm({ ...prizeForm, discountAmount: e.target.value })} />
                </label>
              </div>
              <div className="form-row two-col">
                <label className="field-block">
                  <span className="field-label">Weight <small>(higher = more likely)</small></span>
                  <input type="number" value={prizeForm.weight} onChange={(e) => setPrizeForm({ ...prizeForm, weight: e.target.value })} />
                </label>
                <label className="field-block color-picker-field">
                  <span className="field-label">Segment color</span>
                  <div className="color-picker-row">
                    <input
                      type="color"
                      value={prizeForm.color || "#0f223d"}
                      onChange={(e) => setPrizeForm({ ...prizeForm, color: e.target.value })}
                    />
                    <span className="color-picker-value">{prizeForm.color || "#0f223d"}</span>
                  </div>
                </label>
              </div>
              <div className="form-actions">
                {editingPrizeId && <button type="button" className="secondary-btn" onClick={resetPrizeForm}>Cancel edit</button>}
                <button type="submit" className="stage-btn"><FaPlus /> {editingPrizeId ? "Update in list" : "Add to list"}</button>
              </div>
            </form>
            <ListSection
              title="Wheel prizes"
              empty="No prizes yet."
              items={prizes}
              renderItem={(p) => (
                <>
                  <strong>{p.label}</strong>
                  <span className="list-meta">Weight {p.weight}</span>
                </>
              )}
              onEdit={(p) => { setEditingPrizeId(p.id); setPrizeForm({ ...p, discountPercent: p.discountPercent ?? "", discountAmount: p.discountAmount ?? "" }); }}
              onDelete={removePrize}
            />
          </div>
        )}

        {tab === "discounts" && (
          <div className="extras-panel">
            <p className="field-help panel-intro">
              Apply a discount to selected products. Turn on <strong>General product discounts</strong> under Store Features.
            </p>
            <form onSubmit={stageDiscount} className="extras-form">
              <label className="field-block">
                <span className="field-label">Discount name *</span>
                <input required value={discountForm.name} onChange={(e) => setDiscountForm({ ...discountForm, name: e.target.value })} placeholder="Summer sale" />
              </label>
              <div className="form-row two-col">
                <label className="field-block">
                  <span className="field-label">Discount %</span>
                  <input type="number" step="0.01" value={discountForm.discountPercent} onChange={(e) => setDiscountForm({ ...discountForm, discountPercent: e.target.value })} />
                </label>
                <label className="field-block">
                  <span className="field-label">Discount $</span>
                  <input type="number" step="0.01" value={discountForm.discountAmount} onChange={(e) => setDiscountForm({ ...discountForm, discountAmount: e.target.value })} />
                </label>
              </div>
              <div className="field-block">
                <span className="field-label">Products included</span>
                <div className="product-checkboxes">
                  {products.length === 0 ? (
                    <p className="empty-text">No products yet.</p>
                  ) : (
                    products.map((p) => (
                      <label key={p.id} className="checkbox-field">
                        <input
                          type="checkbox"
                          checked={discountForm.productIds.includes(p.id)}
                          onChange={(e) => {
                            const ids = e.target.checked
                              ? [...discountForm.productIds, p.id]
                              : discountForm.productIds.filter((id) => id !== p.id);
                            setDiscountForm({ ...discountForm, productIds: ids });
                          }}
                        />
                        <span>{p.name}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
              <div className="form-actions">
                {editingDiscountId && <button type="button" className="secondary-btn" onClick={resetDiscountForm}>Cancel edit</button>}
                <button type="submit" className="stage-btn"><FaPlus /> {editingDiscountId ? "Update in list" : "Add to list"}</button>
              </div>
            </form>
            <ListSection
              title="Active discount rules"
              empty="No discount rules yet."
              items={discounts}
              renderItem={(d) => (
                <>
                  <strong>{d.name}</strong>
                  <span className="list-meta">{d.productIds?.length || 0} products</span>
                </>
              )}
              onEdit={(d) => { setEditingDiscountId(d.id); setDiscountForm({ ...d, discountPercent: d.discountPercent ?? "", discountAmount: d.discountAmount ?? "", productIds: d.productIds || [] }); }}
              onDelete={removeDiscount}
            />
          </div>
        )}

        {tab === "features" && (
          <div className="extras-panel features-panel">
            <p className="field-help panel-intro">
              These switches are saved together with your logo, banner, and contact info when you click <strong>Save Changes</strong>.
            </p>
            <div className="feature-toggles">
              <label className="feature-toggle">
                <input type="checkbox" checked={features.spinWheelEnabled} onChange={(e) => onFeaturesChange({ ...features, spinWheelEnabled: e.target.checked })} />
                <div>
                  <strong>Enable spin wheel</strong>
                  <span>Customers can spin once for a checkout discount.</span>
                </div>
              </label>
              <label className="feature-toggle">
                <input type="checkbox" checked={features.spinWheelVisible} onChange={(e) => onFeaturesChange({ ...features, spinWheelVisible: e.target.checked })} />
                <div>
                  <strong>Show spin wheel popup</strong>
                  <span>Display the wheel when a customer logs in.</span>
                </div>
              </label>
              <label className="feature-toggle">
                <input type="checkbox" checked={features.firstOrderDiscountEnabled} onChange={(e) => onFeaturesChange({ ...features, firstOrderDiscountEnabled: e.target.checked })} />
                <div>
                  <strong>First-order discount</strong>
                  <span>Applied when the spin wheel is off and the customer has not ordered before.</span>
                </div>
              </label>
              <div className="form-row two-col feature-inputs">
                <label className="field-block">
                  <span className="field-label">First order discount %</span>
                  <input type="number" step="0.01" value={features.firstOrderDiscountPercent ?? ""} onChange={(e) => onFeaturesChange({ ...features, firstOrderDiscountPercent: e.target.value ? Number(e.target.value) : null })} />
                </label>
                <label className="field-block">
                  <span className="field-label">Or fixed amount ($)</span>
                  <input type="number" step="0.01" value={features.firstOrderDiscountAmount ?? ""} onChange={(e) => onFeaturesChange({ ...features, firstOrderDiscountAmount: e.target.value ? Number(e.target.value) : null })} />
                </label>
              </div>
              <label className="feature-toggle">
                <input type="checkbox" checked={features.generalDiscountsEnabled} onChange={(e) => onFeaturesChange({ ...features, generalDiscountsEnabled: e.target.checked })} />
                <div>
                  <strong>General product discounts</strong>
                  <span>Show discounted prices from the Product Discounts tab.</span>
                </div>
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

function ListSection({ title, empty, items, renderItem, onEdit, onDelete }) {
  return (
    <div className="extras-list-section">
      <h4 className="list-title">{title}</h4>
      {items.length === 0 ? (
        <p className="empty-text">{empty}</p>
      ) : (
        <ul className="extras-list">
          {items.map((item) => (
            <li key={item.id}>
              <div className="list-item-text">{renderItem(item)}</div>
              <div className="list-item-actions">
                <button type="button" className="icon-btn" onClick={() => onEdit(item)} title="Edit">
                  <FaEdit />
                </button>
                <button type="button" className="icon-btn danger" onClick={() => onDelete(item.id)} title="Remove">
                  <FaTrash />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default SettingsExtras;
