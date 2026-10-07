(function(){
"use strict";
const STORE="FARMTEK09 CENTRE", PHONE="254725528888", PAYBILL="400200", ACCOUNT="54095", KEY="farmtek09_cart_checkout";
let cart=load();
const $=id=>document.getElementById(id);
const money=n=>"Ksh "+Number(n||0).toLocaleString("en-KE");
const esc=s=>String(s??"").replace(/[&<>"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]));
const wa=t=>"https://wa.me/"+PHONE+"?text="+encodeURIComponent(t);
const products=()=>Array.isArray(window.PRODUCTS)?window.PRODUCTS:[];
const product=id=>products().find(p=>String(p.id)===String(id));
function load(){try{const x=JSON.parse(localStorage.getItem(KEY)||"[]");return Array.isArray(x)?x:[]}catch(_){return[]}}
function save(){try{localStorage.setItem(KEY,JSON.stringify(cart))}catch(_){}}
function total(){return cart.reduce((s,i)=>s+Number(i.price||0)*Number(i.qty||0),0)}
function count(){return cart.reduce((s,i)=>s+Number(i.qty||0),0)}
function ref(){const d=new Date(),p=n=>String(n).padStart(2,"0");return"FTK"+d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+p(d.getHours())+p(d.getMinutes())+p(d.getSeconds())}
function toast(m){const e=$("toast");if(!e)return;e.textContent=m;e.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>e.hidden=true,2200)}
function render(){
 const items=$("cartItems"),badge=$("cartBadge"),sub=$("subtotal"); if(!items)return;
 const n=count();badge.textContent=n;badge.hidden=n===0;sub.textContent=money(total());
 items.innerHTML=cart.length?cart.map(i=>'<div class="cart-item"><div><b>'+esc(i.name)+'</b><small>'+money(i.price)+' × '+i.qty+'</small></div><div class="qty"><button type="button" data-dec="'+esc(i.id)+'">−</button><span>'+i.qty+'</span><button type="button" data-inc="'+esc(i.id)+'">+</button></div></div>').join(""):'<div class="cart-empty">Your cart is empty.</div>';
}
function add(id,qty){
 const p=product(id);if(!p||p.price==null)return;
 const i=cart.find(x=>String(x.id)===String(id));if(i)i.qty+=qty;else cart.push({id:p.id,name:p.name,price:Number(p.price),qty});
 save();render();toast("Added to cart");
}
function adjust(id,d){
 const i=cart.find(x=>String(x.id)===String(id));if(!i)return;i.qty+=d;
 if(i.qty<1)cart=cart.filter(x=>String(x.id)!==String(id));save();render();
}
function openCart(){$("cartDrawer").classList.add("open");$("drawerOverlay").hidden=false;render()}
function closeCart(){$("cartDrawer").classList.remove("open");$("drawerOverlay").hidden=true}
function closeCheckout(){$("modalOverlay").hidden=true}
function openCheckout(){
 if(!cart.length){toast("Your cart is empty.");return}
 const orderRef=ref();
 $("modalOverlay").hidden=false;
 $("modalContent").innerHTML=
 '<h2 id="modalTitle">Checkout</h2>'+
 '<p class="checkout-kicker">Customer details, delivery and payment</p>'+
 '<label class="customer-field"><span>Full name</span><input id="customerName" type="text" placeholder="Your name" autocomplete="name"></label>'+
 '<label class="customer-field"><span>Phone / WhatsApp</span><input id="customerPhone" type="tel" placeholder="07xx xxx xxx" autocomplete="tel"></label>'+
 '<div class="checkout-pricing"><div><span>Subtotal</span><b>'+money(total())+'</b></div><div class="checkout-total"><span>Order total</span><b>'+money(total())+'</b></div></div>'+
 '<div class="payment-card"><b>M-Pesa PayBill</b><div>Business No: <strong>'+PAYBILL+'</strong></div><div>Account No: <strong>'+ACCOUNT+'</strong></div><small>Order reference: <strong>'+orderRef+'</strong></small><div class="payment-copy-row"><button type="button" class="btn btn-secondary copy-checkout" data-copy="'+PAYBILL+'">Copy Business No.</button><button type="button" class="btn btn-secondary copy-checkout" data-copy="'+ACCOUNT+'">Copy Account No.</button></div></div>'+
 '<div class="delivery-choice"><strong>How would you like to receive your order?</strong><label class="delivery-option selected"><input type="radio" name="deliveryMethod" value="pickup" checked><span><b>Pickup at Lower Kabete</b><small>Collect from Farmtek09 Centre nursery.</small></span></label><label class="delivery-option"><input type="radio" name="deliveryMethod" value="delivery"><span><b>Home / farm delivery</b><small>Delivery charges are arranged separately.</small></span></label></div>'+
 '<div id="deliveryAddressWrap" class="delivery-address"><label>Delivery location<textarea id="deliveryAddress" rows="3" placeholder="Estate, building, street, landmark and phone/contact details"></textarea></label></div>'+
 '<div class="payment-choice"><strong>Payment method</strong><label class="payment-option selected"><input type="radio" name="paymentMethod" value="mpesa" checked><span><b>M-Pesa PayBill</b><small>PayBill '+PAYBILL+', Account '+ACCOUNT+'.</small></span></label><label class="payment-option"><input type="radio" name="paymentMethod" value="cash"><span><b>Cash</b><small>Pay when collecting or on delivery.</small></span></label></div>'+
 '<div class="order-summary">'+cart.map(i=>'<div><span>'+esc(i.name)+' × '+i.qty+'</span><b>'+money(i.price*i.qty)+'</b></div>').join("")+'</div>'+
 '<div class="actions-stack"><button id="copyCheckoutDetails" type="button" class="btn btn-secondary full">Copy order & payment details</button><button id="sendCheckoutOrder" type="button" class="btn btn-whatsapp full">Send order on WhatsApp</button><button id="downloadOrderData" type="button" class="btn btn-secondary full">Download order data</button></div>';
 bindCheckout(orderRef);
}
function state(){
 const delivery=document.querySelector('input[name="deliveryMethod"]:checked')?.value||"pickup";
 const payment=document.querySelector('input[name="paymentMethod"]:checked')?.value||"mpesa";
 return {name:$("customerName").value.trim(),phone:$("customerPhone").value.trim(),delivery,payment,address:delivery==="delivery"?$("deliveryAddress").value.trim():""};
}
function bindCheckout(orderRef){
 document.querySelectorAll('input[name="deliveryMethod"],input[name="paymentMethod"]').forEach(e=>e.onchange=()=>{
   const s=state();$("deliveryAddressWrap").classList.toggle("show",s.delivery==="delivery");
   document.querySelectorAll(".delivery-option,.payment-option").forEach(x=>x.classList.toggle("selected",!!x.querySelector("input")?.checked));
 });
 document.querySelectorAll(".copy-checkout").forEach(b=>b.onclick=async()=>{try{await navigator.clipboard.writeText(b.dataset.copy);toast("Copied")}catch(_){toast("Copy failed; use the number shown.")}});
 $("copyCheckoutDetails").onclick=async()=>{
   const s=state(),text=["Order reference: "+orderRef,"Total: "+money(total()),"Fulfilment: "+(s.delivery==="delivery"?"Home / farm delivery":"Pickup at Lower Kabete"),s.address?"Delivery location: "+s.address:"","Payment: "+(s.payment==="mpesa"?"M-Pesa PayBill":"Cash"),s.payment==="mpesa"?"PayBill: "+PAYBILL:"",s.payment==="mpesa"?"Account: "+ACCOUNT:""].filter(Boolean).join("\n");
   try{await navigator.clipboard.writeText(text);toast("Order details copied")}catch(_){toast("Copy failed; use the details shown.")};
 };
 $("sendCheckoutOrder").onclick=()=>{
   const s=state();if(!s.name||!s.phone){toast("Please enter your name and phone number.");return}
   const msg=["Hi "+STORE+"! I want to place order "+orderRef+".","Customer: "+s.name,"Phone: "+s.phone,"",cart.map(i=>"• "+i.name+" × "+i.qty+" — "+money(i.price*i.qty)).join("\n"),"","Total: "+money(total()),"","Fulfilment: "+(s.delivery==="delivery"?"Home / farm delivery":"Pickup at Lower Kabete"),s.address?"Delivery location: "+s.address:"","Payment: "+(s.payment==="mpesa"?"M-Pesa PayBill":"Cash"),s.payment==="mpesa"?"PayBill: "+PAYBILL:"",s.payment==="mpesa"?"Account: "+ACCOUNT:""].filter(Boolean).join("\n");
   try{localStorage.setItem("farmtek09_last_order",JSON.stringify({orderNumber:orderRef,createdAt:new Date().toISOString(),customer:{name:s.name,phone:s.phone},items:cart,total:total(),fulfilment:s.delivery,deliveryAddress:s.address,paymentMethod:s.payment,status:"Pending"}))}catch(_){}
   window.open(wa(msg),"_blank","noopener");cart=[];save();render();closeCheckout();closeCart();toast("Order sent to WhatsApp");
 };
 $("downloadOrderData").onclick=()=>{
   const s=state();if(!s.name||!s.phone){toast("Please enter your name and phone number.");return}
   const data={orderNumber:orderRef,createdAt:new Date().toISOString(),customer:{name:s.name,phone:s.phone},items:cart,total:total(),fulfilment:s.delivery,deliveryAddress:s.address,paymentMethod:s.payment};
   const a=document.createElement("a"),url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:"application/json"}));a.href=url;a.download=orderRef+".json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 };
}
function transformCards(){
 document.querySelectorAll(".card[data-product-id]").forEach(card=>{
  if(card.dataset.cartReady==="1")return;
  const p=product(card.dataset.productId),cta=card.querySelector(".card-cta");if(!p||p.price==null||!cta)return;
  const body=card.querySelector(".card-body"),step=document.createElement("div");step.className="qty-stepper";step.innerHTML='<button class="qty-btn" type="button" data-step="-1">−</button><span class="qty-value">1</span><button class="qty-btn" type="button" data-step="1">+</button>';
  const addBtn=document.createElement("button");addBtn.type="button";addBtn.className="btn btn-order card-cta";addBtn.textContent="Add to Cart";addBtn.dataset.add=p.id;
  const quick=document.createElement("a");quick.className="mini-wa";quick.target="_blank";quick.rel="noopener";quick.href=wa("Hi! I'd like to order:\n\n"+p.name+"\nPrice: "+money(p.price)+"\n\nPlease confirm availability.");quick.textContent="Order on WhatsApp";
  cta.replaceWith(step,addBtn,quick);card.dataset.cartReady="1";
  body.addEventListener("click",e=>{const sb=e.target.closest("[data-step]");if(sb){const v=step.querySelector(".qty-value");v.textContent=String(Math.max(1,Number(v.textContent)+Number(sb.dataset.step)));return}const ab=e.target.closest("[data-add]");if(ab){add(p.id,Number(step.querySelector(".qty-value").textContent||1));step.querySelector(".qty-value").textContent="1"}});
 });
}
function init(){
 $("cartOpen").onclick=openCart;$("cartClose").onclick=closeCart;$("drawerOverlay").onclick=closeCart;$("checkout").onclick=()=>{closeCart();openCheckout()};$("cartWhatsapp").onclick=()=>{if(cart.length)window.open(wa("Hi "+STORE+"! I'd like to order:\n\n"+cart.map(i=>"• "+i.name+" × "+i.qty+" — "+money(i.price*i.qty)).join("\n")+"\n\nTotal: "+money(total())),"_blank","noopener")};
 $("cartItems").onclick=e=>{const a=e.target.closest("[data-inc]"),d=e.target.closest("[data-dec]");if(a)adjust(a.dataset.inc,1);if(d)adjust(d.dataset.dec,-1)};
 $("modalClose").onclick=closeCheckout;$("modalOverlay").onclick=e=>{if(e.target===$("modalOverlay"))closeCheckout()};
 render();transformCards();
 const grid=$("productGrid");if(grid)new MutationObserver(transformCards).observe(grid,{childList:true});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();