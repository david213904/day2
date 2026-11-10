const API = window.API_BASE;
const $ = (id) => document.getElementById(id);
const won = (n) => n.toLocaleString("ko-KR") + "원";
const ESC = {"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"};
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ESC[c]);
const BG = ["#ffe9cc", "#fde0e6", "#e3f4e1", "#e1effb", "#fff3c4", "#eadcf8", "#ffe1d6", "#dff5f2"];

// 브라우저마다 고유한 장바구니 번호 (다른 사람 것과 섞이지 않게)
function getCartId() {
  try {
    let id = localStorage.getItem("jeju_cart_id");
    if (!id) { id = crypto.randomUUID(); localStorage.setItem("jeju_cart_id", id); }
    return id;
  } catch { return "tmp-" + Math.random().toString(36).slice(2, 14); }
}
const CART_ID = getCartId();

let products = [], cart = {items: [], total: 0, count: 0}, filter = "전체", busy = false;

async function api(path, opts = {}) {
  let res;
  try {
    res = await fetch(API + path, {
      headers: {"Content-Type": "application/json"},
      ...opts,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
  } catch {
    throw new Error("서버에 연결할 수 없어요. 잠시 뒤 다시 시도해 주세요.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(typeof data.detail === "string" ? data.detail : "요청을 처리하지 못했어요.");
  return data;
}

let toastTimer;
function toast(msg) {
  const t = $("toast"); t.textContent = msg; t.classList.add("show");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
}
function notice(msg) { const n = $("notice"); n.hidden = !msg; n.textContent = msg || ""; }

function bgOf(id) { const i = products.findIndex((p) => p.id === id); return BG[(i < 0 ? 0 : i) % BG.length]; }

function renderChips() {
  const tags = ["전체", ...new Set(products.map((p) => p.tag))];
  $("chips").innerHTML = tags.map((t) => `<button class="chip${t === filter ? " on" : ""}" data-t="${esc(t)}">${esc(t)}</button>`).join("");
}
function renderGrid() {
  const list = products.filter((p) => filter === "전체" || p.tag === filter);
  $("grid").innerHTML = list.map((p, i) => `
    <article class="card" style="animation-delay:${i * 50}ms">
      <div class="pic" style="background:${bgOf(p.id)}"><span class="tag">${esc(p.tag)}</span>${p.emoji}</div>
      <div class="info">
        <h3>${esc(p.name)}</h3><p>${esc(p.desc)}</p>
        <div class="row"><span class="price">${won(p.price)}</span>
        <button class="add" data-id="${esc(p.id)}">담기 +</button></div>
      </div>
    </article>`).join("");
}
function renderCart() {
  const b = $("badge"); const prev = b.textContent;
  b.textContent = cart.count;
  if (String(cart.count) !== prev) { b.classList.remove("bump"); void b.offsetWidth; b.classList.add("bump"); }
  $("total").textContent = won(cart.total);
  $("order").disabled = cart.count === 0;
  $("clear").hidden = cart.count === 0;
  $("cartBody").innerHTML = cart.items.length ? cart.items.map((it) => `
    <div class="line">
      <div class="thumb" style="background:${bgOf(it.id)}">${it.emoji}</div>
      <div>
        <h4>${esc(it.name)}</h4><small>${won(it.price)}</small><br>
        <div class="qty"><button data-act="dec" data-id="${esc(it.id)}" aria-label="하나 빼기">−</button><span>${it.qty}</span><button data-act="inc" data-id="${esc(it.id)}" aria-label="하나 더하기">+</button></div>
      </div>
      <div class="right"><b>${won(it.line_total)}</b><button class="del" data-act="del" data-id="${esc(it.id)}">삭제</button></div>
    </div>`).join("") : `<div class="empty"><b>🧺</b>장바구니가 비어 있어요.<br>마음에 드는 상품을 담아 보세요!</div>`;
}

async function run(fn, okMsg) {
  if (busy) return;
  busy = true;
  try { cart = await fn(); renderCart(); notice(""); if (okMsg) toast(okMsg); }
  catch (e) { notice(e.message); toast("앗, 문제가 생겼어요"); }
  finally { busy = false; }
}
const addItem = (id) => run(() => api(`/cart/${CART_ID}/items`, {method: "POST", body: {product_id: id, qty: 1}}), "장바구니에 담았어요 🛒");
const delItem = (id) => run(() => api(`/cart/${CART_ID}/items/${id}`, {method: "DELETE"}), "삭제했어요");
const setQty = (id, q) => q < 1 ? delItem(id) : run(() => api(`/cart/${CART_ID}/items/${id}`, {method: "PATCH", body: {qty: q}}));

function openCart(open) {
  const o = $("overlay"), d = $("drawer");
  if (open) { o.hidden = false; requestAnimationFrame(() => o.classList.add("show")); d.classList.add("open"); }
  else { o.classList.remove("show"); d.classList.remove("open"); setTimeout(() => { if (!d.classList.contains("open")) o.hidden = true; }, 250); }
  d.setAttribute("aria-hidden", String(!open));
}

document.addEventListener("click", (e) => {
  const t = e.target.closest("button"); if (!t) return;
  if (t.classList.contains("add")) { t.disabled = true; addItem(t.dataset.id).finally(() => (t.disabled = false)); }
  else if (t.classList.contains("chip")) { filter = t.dataset.t; renderChips(); renderGrid(); }
  else if (t.dataset.act) {
    const it = cart.items.find((x) => x.id === t.dataset.id); if (!it) return;
    if (t.dataset.act === "inc") setQty(it.id, it.qty + 1);
    if (t.dataset.act === "dec") setQty(it.id, it.qty - 1);
    if (t.dataset.act === "del") delItem(it.id);
  }
});
$("openCart").onclick = () => openCart(true);
$("closeCart").onclick = () => openCart(false);
$("overlay").onclick = () => openCart(false);
addEventListener("keydown", (e) => { if (e.key === "Escape") openCart(false); });
$("clear").onclick = () => run(() => api(`/cart/${CART_ID}`, {method: "DELETE"}), "장바구니를 비웠어요");
$("order").onclick = () => toast("데모 사이트라 실제 결제는 지원하지 않아요 🙂");

(async function init() {
  renderCart();
  try {
    products = await api("/products");
    renderChips(); renderGrid();
    cart = await api(`/cart/${CART_ID}`);
    renderCart();
  } catch (e) {
    if (!products.length) $("grid").innerHTML = "";
    notice(e.message);
  }
})();
