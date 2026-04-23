/* script.js - Full Version (Part 1/2) */
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzhKY9MXntcaKDvijcrdp6I_jflWX2fseXmg5zPoo6376wDdJGNiNZS4KJLz0hvsXUZ/exec";

let products = JSON.parse(localStorage.getItem('angun_cache')) || [];
let cart = {}; 
let isAdmin = false;
let currentPass = "1234";

// 1. ฟังก์ชันเริ่มต้นสำหรับคลื่นและไอคอนลอย
function initDecors() {
    const container = document.getElementById('deco-container');
    const svgs = [
        `<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z"/></svg>`,
        `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`
    ];
    const pos = [{t:10,l:5},{t:15,l:85},{t:40,l:10},{t:45,l:92},{t:70,l:5},{t:75,l:80},{t:25,l:45},{t:90,l:40}];
    if(container) container.innerHTML = pos.map((p, i) => `<div class="floating-deco" style="top:${p.t}%; left:${p.l}%; color:var(--pj-bg); animation-delay:${i*0.4}s">${svgs[i%2]}</div>`).join('');
    
    const logo = document.getElementById('wave-logo');
    if(logo) logo.innerHTML = "ANGUN WAN".split('').map((c, i) => `<span class="wave-letter" style="--i:${i}">${c===' '?' ':c}</span>`).join('');
}

function updateDropdowns(dropdownData) {
    if(!dropdownData) return;
    const fill = (id, items) => {
        const el = document.getElementById(id);
        if(el) {
            el.innerHTML = items
                .filter(x => x && x !== "TaskTypes" && x !== "TaskTypes2" && x !== "Channels")
                .map(item => `<option value="${item}">`).join('');
        }
    };
    fill('list-cat', dropdownData.mainCats);
    fill('list-sub', dropdownData.subCats);
    fill('list-net', dropdownData.channels);
}

function renderCard(p) {
    const rowId = Number(p.row);
    const qty = cart[rowId] || 0; 
    const finalPrice = p.price - (p.discount || 0);
    const isLimit = p.limitOne === true || p.limitOne === "YES";
    const previewLink = p.preview || "";
    const hasPreview = previewLink.length > 5;

    return `
        <div class="product-card border border-pj-brown-light/10 shadow-sm">
            ${p.discount > 0 ? `<div class="sale-badge">SALE</div>` : ''}
            <div class="aspect-square rounded-[22px] overflow-hidden mb-3 bg-pj-blue-light/50">
                <img src="${p.image}" class="w-full h-full object-cover" onerror="this.src='https://placehold.co/400?text=AngunWan'">
            </div>
            <h4 class="text-[11px] font-bold truncate px-1">${p.name}</h4>
            ${hasPreview ? `
                <a href="${previewLink}" target="_blank" class="mt-2 mb-2 p-2 bg-pj-blue-light/80 rounded-lg flex items-center justify-center gap-2 text-[10px] text-pj-brown-dark font-bold hover:bg-pj-brown-light/20 transition-all border border-pj-brown-light/10">
                    <i data-lucide="eye" class="w-3.5 h-3.5"></i> ดูตัวอย่าง
                </a>
            ` : '<div class="h-[2px]"></div>'}
            <div class="mt-1 px-1 flex items-center gap-1 font-bold">
                <span class="text-xs text-pj-brown-dark">${finalPrice}.-</span>
                ${p.discount > 0 ? `<span class="text-[9px] line-through opacity-30">${p.price}.-</span>` : ''}
            </div>
            <div class="mt-3">
                ${qty === 0 ? 
                    `<button onclick="updateCart(${rowId}, 1, ${isLimit})" class="w-full py-2 btn-pj-main rounded-xl text-[10px] shadow-md">ใส่ตะกร้า</button>` :
                    `<div class="flex items-center justify-between bg-pj-blue-light/60 p-1 rounded-xl">
                        <button onclick="updateCart(${rowId}, -1, ${isLimit})" class="btn-qty-action btn-minus-style">✕</button>
                        <span class="text-xs font-bold">${qty} ชุด</span>
                        <button onclick="updateCart(${rowId}, 1, ${isLimit})" class="btn-qty-action btn-plus-style ${isLimit ? 'opacity-20 pointer-events-none' : ''}">＋</button>
                    </div>`
                }
            </div>
        </div>`;
}

function updateCart(rowId, change, limitOne) {
    const id = Number(rowId);
    const currentQty = cart[id] || 0;
    const newQty = currentQty + change;
    if (newQty <= 0) { delete cart[id]; } 
    else if (limitOne && change > 0 && currentQty >= 1) { alert("มีสินค้านี้ในตะกร้าแล้ว (จำกัดซื้อได้เพียง 1 ชิ้นจ้า)"); } 
    else { cart[id] = newQty; }
    refreshUI();
    if(document.getElementById('cart-modal').classList.contains('active')) renderCartItems();
}

function refreshUI() {
    const badge = document.getElementById('cart-badge');
    const totalItems = Object.values(cart).reduce((a, b) => a + b, 0);
    if(badge) {
        badge.innerText = totalItems;
        badge.style.display = totalItems > 0 ? 'flex' : 'none';
    }
    renderHome();
    const catTitle = document.getElementById('cat-header-title');
    if(!document.getElementById('page-subcat').classList.contains('hidden-page') && catTitle) {
        handleGroupClick(catTitle.innerText, true); 
    }
    setTimeout(() => { if(window.lucide) lucide.createIcons(); }, 100);
}
/* script.js - Full Version (Part 2/2) */
async function syncData() {
    try {
        const res = await fetch(SCRIPT_URL);
        const data = await res.json();
        if(data.status === 'success') {
            products = data.products;
            localStorage.setItem('angun_cache', JSON.stringify(products));
            if(data.settings) {
                if(data.settings.profileImg) document.getElementById('shop-profile-img').src = data.settings.profileImg;
                if(data.settings.shopName) document.getElementById('shop-name-display').innerText = data.settings.shopName;
                currentPass = data.settings.adminPass;
            }
            refreshUI();
            renderAdminItems();
        }
    } catch(e) { console.warn("Offline Mode"); refreshUI(); }
}

function renderHome() {
    const grid = document.getElementById('home-grid');
    if(grid) grid.innerHTML = products.filter(p => p.recommended).map(p => renderCard(p)).join('');
}

function initNav() {
    const groups = ['ฟอนต์', 'ลายน้ำ', 'BG', 'ไฟล์ตกแต่ง', 'อื่นๆ', 'รวมกลุ่ม'];
    const container = document.getElementById('group-nav-list');
    if(container) container.innerHTML = groups.map(g => `<button onclick="handleGroupClick('${g}')" class="category-pill shadow-sm">${g}</button>`).join('');
}

function handleGroupClick(g, isRefresh = false) {
    const categoryProducts = products.filter(p => p.cat === (g === 'รวมกลุ่ม' ? 'กลุ่ม' : g));
    const sheetCategory = g === 'รวมกลุ่ม' ? 'กลุ่ม' : g;
    if (!isRefresh) showPage('subcat');
    document.getElementById('cat-header-title').innerText = g;
    renderNetworks(sheetCategory, 'รวมทั้งหมด');
}

function renderNetworks(cat, sub) {
    const container = document.getElementById('networks-list-view');
    let items = products.filter(p => p.cat === cat);
    const nets = [...new Set(items.map(p => p.network))];
    container.innerHTML = nets.map(net => {
        const netItems = items.filter(p => p.network === net);
        return `<div class="bg-white/40 p-5 rounded-[40px] mb-8 shadow-sm">
            <h4 class="font-bold mb-5 border-l-4 border-pj-brown-main pl-3 text-pj-brown-dark">เครือ: ${net || 'ทั่วไป'}</h4>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-5">${netItems.map(p => renderCard(p)).join('')}</div>
        </div>`;
    }).join('');
    if (window.lucide) lucide.createIcons();
}

function showPage(id) {
    document.querySelectorAll('.page-container').forEach(p => p.classList.add('hidden-page'));
    const el = document.getElementById('page-'+id);
    if(el) el.classList.remove('hidden-page');
    const header = document.getElementById('main-header');
    if(id === 'checkout') header.style.display = 'none'; else header.style.display = 'block';
    window.scrollTo(0, 0);
}

function toggleCartModal(show) { document.getElementById('cart-modal').classList.toggle('active', show); if(show) renderCartItems(); }

function renderCartItems() {
    const list = document.getElementById('cart-list-items');
    let sum = 0;
    list.innerHTML = Object.keys(cart).map(rowId => {
        const p = products.find(x => Number(x.row) === Number(rowId));
        if(!p) return '';
        const qty = cart[rowId];
        const pricePerUnit = p.price - (p.discount || 0);
        sum += pricePerUnit * qty;
        return `<div class="flex flex-col bg-pj-blue-light/40 p-4 rounded-3xl mb-2"><span class="text-xs font-bold">${p.name} (x${qty})</span><span class="text-xs">${pricePerUnit * qty}.-</span></div>`;
    }).join('') || '<p class="text-center py-10 opacity-30">ตะกร้าว่างเปล่า</p>';
    document.getElementById('cart-sum').innerText = sum;
}

// 🛡️ SECURITY SYSTEM (Randomized)
const isDevMode = false; 
if (!isDevMode) {
    const warnings = ["อย่าแกะโค้ดเลยจ้า ✨", "ห้ามคัดลอก!", "ทักถาม @309ranuu นะ", "ลิขสิทธิ์โดย Grawii Studio"];
    const prankLinks = ["https://www.youtube.com/watch?v=dQw4w9WgXcQ", "https://www.youtube.com/watch?v=y6120QOlsfU"];
    const triggerSecurityAction = () => {
        alert(warnings[Math.floor(Math.random() * warnings.length)]);
        window.open(prankLinks[Math.floor(Math.random() * prankLinks.length)], '_blank'); 
    };
    document.addEventListener('contextmenu', e => { e.preventDefault(); triggerSecurityAction(); });
    document.onkeydown = e => {
        if (e.keyCode == 123 || (e.ctrlKey && e.shiftKey && (e.keyCode == 73 || e.keyCode == 74)) || (e.ctrlKey && e.keyCode == 85)) {
            triggerSecurityAction(); return false;
        }
    };
}

// 🚀 INITIALIZE ALL
window.addEventListener('DOMContentLoaded', () => {
    initDecors(); 
    initNav();    
    syncData();   
    if (window.lucide) lucide.createIcons();
});
