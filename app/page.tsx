
export default function Home() {
  const markets = [
    { name: "بیت‌کوین", symbol: "BTC", price: "$67,420", change: "+2.4%" },
    { name: "طلای جهانی", symbol: "GOLD", price: "$2,735", change: "+0.8%" },
    { name: "یورو / دلار", symbol: "EUR/USD", price: "1.0842", change: "-0.3%" },
    { name: "نفت خام", symbol: "OIL", price: "$71.80", change: "+1.1%" },
  ];

  const styles = `
    * { box-sizing: border-box; }
    body { margin: 0; background: #08111f; color: #edf5ff; font-family: Arial, sans-serif; }
    a { color: inherit; text-decoration: none; }
    .wrap { max-width: 1120px; margin: auto; padding: 0 22px; }
    header { border-bottom: 1px solid #233044; }
    .nav { min-height: 76px; display: flex; align-items: center; justify-content: space-between; gap: 18px; flex-wrap: wrap; }
    .logo { font-size: 27px; font-weight: 900; color: #67e8f9; }
    nav { display: flex; gap: 22px; color: #c1cede; font-size: 14px; }
    .pill { border: 1px solid #28586a; color: #a5f3fc; padding: 9px 13px; border-radius: 22px; font-size: 12px; }
    .hero { padding-top: 78px; padding-bottom: 72px; }
    .eyebrow { color: #67e8f9; font-size: 12px; letter-spacing: 3px; }
    h1 { font-size: clamp(36px, 7vw, 64px); line-height: 1.35; margin: 18px 0; }
    .accent { color: #67e8f9; }
    .intro { color: #aab9cd; line-height: 2; max-width: 650px; font-size: 17px; }
    .cta { display: inline-block; margin-top: 20px; padding: 14px 20px; border-radius: 10px; background: #67e8f9; color: #07111d; font-weight: bold; }
    .section { padding-bottom: 64px; }
    .section-head { display: flex; justify-content: space-between; align-items: end; gap: 15px; flex-wrap: wrap; margin-bottom: 22px; }
    h2 { margin: 8px 0; font-size: 27px; }
    .muted { color: #8494aa; font-size: 12px; }
    .grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 15px; }
    .card { border: 1px solid #263448; background: #101c2d; border-radius: 16px; padding: 20px; }
    .name { color: #aab9cd; font-size: 14px; }
    .price { font-size: 25px; font-weight: bold; margin: 20px 0 12px; overflow-wrap: anywhere; }
    .meta { display: flex; justify-content: space-between; gap: 8px; font-size: 12px; color: #8494aa; }
    .up { color: #6ee7b7; } .down { color: #fda4af; }
    .brief { border: 1px solid #263448; border-radius: 18px; padding: 28px; background: #0e1b2c; margin-bottom: 64px; }
    footer { border-top: 1px solid #233044; color: #8494aa; text-align: center; padding: 28px 12px; font-size: 12px; }
    @media(max-width: 760px) { .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .hero { padding-top: 52px; } nav { gap: 12px; } }
    @media(max-width: 390px) { .grid { grid-template-columns: 1fr; } }
  `;

  return (
    <main dir="rtl">
      <style>{styles}</style>
      <header>
        <div className="wrap nav">
          <a href="#" className="logo">ECO<span style={{ color: "#fff" }}>NOVA</span></a>
          <nav>
            <a href="#markets">بازارها</a>
            <a href="#news">اخبار</a>
            <a href="#about">درباره ما</a>
          </nav>
          <span className="pill">داشبورد اقتصادی</span>
        </div>
      </header>

      <section className="wrap hero">
        <p className="eyebrow">ECONOMIC INTELLIGENCE</p>
        <h1>نبض بازارها،<br /><span className="accent">در یک نگاه</span></h1>
        <p className="intro">
          بازارهای مالی، قیمت دارایی‌ها و خبرهای اقتصادی را در یک محیط
          مدرن دنبال کن. Econova برای تصمیم‌گیری آگاهانه‌تر طراحی شده است.
        </p>
        <a className="cta" href="#markets">مشاهده بازارها ←</a>
      </section>

      <section className="wrap section" id="markets">
        <div className="section-head">
          <div>
            <p className="eyebrow">MARKET WATCH</p>
            <h2>نمای کلی بازار</h2>
          </div>
          <span className="muted">قیمت‌های نمونه؛ هنوز زنده نیستند</span>
        </div>
        <div className="grid">
          {markets.map((item) => (
            <article className="card" key={item.symbol}>
              <div className="name">{item.name}</div>
              <div className="price">{item.price}</div>
              <div className="meta">
                <span>{item.symbol}</span>
                <span className={item.change.startsWith("+") ? "up" : "down"}>
                  {item.change}
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="wrap" id="news">
        <div className="brief">
          <p className="eyebrow">ECONOMIC BRIEFING</p>
          <h2>اخبار و تحلیل‌های اقتصادی</h2>
          <p className="intro">
            این بخش برای نمایش اخبار معتبر اقتصادی آماده شده است.
            در نسخه فعلی هنوز به منبع خبری زنده متصل نیست.
          </p>
        </div>
      </section>

      <footer id="about">
        <div>© Econova — نسخه اولیه</div>
        <p>اطلاعات قیمت فعلاً نمایشی است و مبنای تصمیم مالی نیست.</p>
      </footer>
    </main>
  );
}
