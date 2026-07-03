import ModuleHomeNav from "./ModuleHomeNav.jsx";

export default function ModuleHeader({ productName }) {
  return (
    <header className="module-header" aria-label="Module header">
      <ModuleHomeNav />
      <div className="module-header__brand">
        <img
          className="module-header__logo"
          src="/hefzech-logo.png"
          alt="HFZWood"
        />
        <p className="module-header__product">HFZWood</p>
      </div>
      <p className="module-header__title">{productName}</p>
    </header>
  );
}
