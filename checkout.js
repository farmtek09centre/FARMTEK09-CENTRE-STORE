
(function(){
  "use strict";
  const STORE="FARMTEK09 CENTRE";
  const PHONE="254725528888";
  const PAYBILL="400200";
  const ACCOUNT="54095";
  const KEY="farmtek09_cart_checkout";
  let cart=loadCart();
  let orderRef="";

  function $(id){return document.getElementById(id);}
  function money(v){return "Ksh "+Number(v||0).toLocaleString("en-KE");}
  function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,function(m){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m];});}
  function wa(text){return "https://wa.me/"+PHONE+"?text="+encodeURIComponent(text);}
  function products(){return Array.isArray(window.PRODUCTS)?window.PRODUCTS:[];}
  function product(id){return products().find(function(p){return String(p.id)===String(id);});}
  function loadCart(){try{var v=JSON.parse(localStorage.getItem(KEY)||"[]");return Array.isArray(v)?v:[];}catch(e){return [];}}
  function saveCart(){try{localStorage.setItem(KEY,JSON.stringify(cart));}catch(e){}}
  function total(){return cart.reduce(function(s,i){return s+Number(i.price||0)*Number(i.qty||0);},0);}
  function count(){return cart.reduce(function(s,i){return s+Number(i.qty||0);},0);}
  function newRef(){var d=new Date(),p=function(n){return String(n).padStart(2,"0");};return "FTK"+d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+p(d.getHours())+p(d.getMinutes())+p(d.getSeconds());}
  function toast(msg){var el=$("toast");if(!el)return;el.textContent=msg;el.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(function(){el.hidden=true;},2200);}
  function renderCart(){
    var items=$("cartItems"),sub=$("subtotal"),badge=$("cartBadge");
    if(!items)return;
    sub.textContent=money(total());
    badge.textContent=String(count());
    badge.hidden=count()===0;
    if(!cart.length){items.innerHTML='<div class="cart-empty">Your cart is empty.</div>';return;}
    items.innerHTML=cart.map(function(i){
      return '<div class="cart-item"><div><b>'+esc(i.name)+'</b><small>'+money(i.price)+' × '+i.qty+'</small></div><div class="qty"><button type="button" data-cart-dec="'+esc(i.id)+'">−</button><span>'+i.qty+'</span><button type="button" data-cart-inc="'+esc(i.id)+'">+</button></div></div>';
    }).join("");
  }
  function openCart(){$("cartDrawer").classList.add("open");$("drawerOverlay").hidden=false;renderCart();}
  function closeCart(){$("cartDrawer").classList.remove("open");$("drawerOverlay").hidden=true;}
  function closeModal(){$("modalOverlay").hidden=true;}
  function addToCart(id,qty){
    var p=product(id);if(!p||p.price==null)return;
    var q=Math.max(1,Number(qty)||1),i=cart.find(function(x){return String(x.id)===String(id);});
    if(i)i.qty+=q;else cart.push({id:p.id,name:p.name,price:Number(p.price),qty:q});
    saveCart();renderCart();toast("Added to cart");
  }
  function adjust(id,delta){
    var i=cart.find(function(x){return String(x.id)===String(id);});if(!i)return;
    i.qty+=delta;if(i.qty<1)cart=cart.filter(function(x){return String(x.id)!==String(id);});
    saveCart();renderCart();
  }
  function directOrder(p){return "Hi! I'd like to order:\\n\\n"+p.name+"\\nPrice: "+money(p.price)+"\\n\\nPlease confirm availability.";}
  function quickCartMessage(){return "Hi "+STORE+"! I'd like to order:\\n\\n"+cart.map(function(i){return "• "+i.name+" × "+i.qty+" — "+money(i.price*i.qty);}).join("\\n")+"\\n\\nTotal: "+money(total());}

  function checkout(){
    if(!cart.length){toast("Your cart is empty.");return;}
    orderRef=newRef();
    $("modalOverlay").hidden=false;
    $("modalContent").innerHTML=
      '<h2 id="modalTitle">Checkout</h2>'+
      '<p class="checkout-kicker">Customer details, delivery and payment</p>'+
      '<label class="customer-field"><span>Full name</span><input id="customerName" type="text" placeholder="Your name" autocomplete="name"></label>'+
      '<label class="customer-field"><span>Phone / WhatsApp</span><input id="customerPhone" type="tel" placeholder="07xx xxx xxx" autocomplete="tel"></label>'+
      '<div class="checkout-pricing"><div><span>Subtotal</span><b>'+money(total())+'</b></div><div class="checkout-total"><span>Order total</span><b>'+money(total())+'</b></div></div>'+
      '<div class="payment-card"><b>M-Pesa PayBill</b><div>Business No: <strong>'+PAYBILL+'</strong></div><div>Account No: <strong>'+ACCOUNT+'</strong></div><small>Order reference: <strong>'+orderRef+'</strong></small><div class="payment-copy-row"><button type="button" class="btn btn-secondary copy-checkout" data-copy="'+PAYBILL+'">Copy Business No.</button><button type="button" class="btn btn-secondary copy-checkout" data-copy="'+ACCOUNT+'">Copy Account No.</button></div></div>'+
      '<div class="delivery-choice"><strong>How would you like to receive your order?</strong>'+
      '<label class="delivery-option selected"><input type="radio" name="deliveryMethod" value="pickup" checked><span><b>Pickup at Lower Kabete</b><small>Collect from Farmtek09 Centre nursery.</small></span></label>'+
      '<label class="delivery-option"><input type="radio" name="deliveryMethod" value="delivery"><span><b>Home / farm delivery</b><small>Delivery charges are arranged separately.</small></span></label></div>'+
      '<div id="deliveryAddressWrap" class="delivery-address"><label>Delivery location<textarea id="deliveryAddress" rows="3" placeholder="Estate, building, street, landmark and phone/contact details"></textarea></label></div>'+
      '<div class="payment-choice"><strong>Payment method</strong>'+
      '<label class="payment-option selected"><input type="radio" name="paymentMethod" value="mpesa" checked><span><b>M-Pesa PayBill</b><small>PayBill '+PAYBILL+', Account '+ACCOUNT+'.</small></span></label>'+
      '<label class="payment-option"><input type="radio" name="paymentMethod" value="cash"><span><b>Cash</b><small>Pay when collecting or on delivery.</small></span></label></div>'+
      '<div class="order-summary">'+cart.map(function(i){return '<div><span>'+esc(i.name)+' × '+i.qty+'</span><b>'+money(i.price*i.qty)+'</b></div>';}).join("")+'</div>'+
      '<div class="actions-stack"><button id="copyCheckoutDetails" type="button" class="btn btn-secondary full">Copy order & payment details</button><button id="sendCheckoutOrder" type="button" class="btn btn-whatsapp full">Send order on WhatsApp</button><button id="downloadOrderData" type="button" class="btn btn-secondary full">Download order data</button></div>';
    bindCheckout();
  }

  function state(){
    var delivery=document.querySelector('input[name="deliveryMethod"]:checked')?.value||"pickup";
    var payment=document.querySelector('input[name="paymentMethod"]:checked')?.value||"mpesa";
    return {
      name:$("customerName").value.trim(),
      phone:$("customerPhone").value.trim(),
      delivery:delivery,
      payment:payment,
      address:delivery==="delivery"?($("deliveryAddress").value.trim()||"Not provided"):""
    };
  }

  function bindCheckout(){
    document.querySelectorAll('input[name="deliveryMethod"],input[name="paymentMethod"]').forEach(function(el){
      el.addEventListener("change",function(){
        var s=state();
        $("deliveryAddressWrap").classList.toggle("show",s.delivery==="delivery");
        document.querySelectorAll(".delivery-option,.payment-option").forEach(function(x){
          x.classList.toggle("selected",!!x.querySelector("input")?.checked);
        });
      });
    });
    document.querySelectorAll(".copy-checkout").forEach(function(btn){
      btn.addEventListener("click",async function(){
        try{await navigator.clipboard.writeText(btn.dataset.copy);toast("Copied");}catch(e){toast("Copy failed; use the number shown.");}
      });
    });
    $("copyCheckoutDetails").onclick=async function(){
      var s=state();
      var text=["Order reference: "+orderRef,"Total: "+money(total()),"Fulfilment: "+(s.delivery==="delivery"?"Home / farm delivery":"Pickup at Lower Kabete"),s.address?"Delivery location: "+s.address:"","Payment: "+(s.payment==="mpesa"?"M-Pesa PayBill":"Cash"),s.payment==="mpesa"?"PayBill: "+PAYBILL:"",s.payment==="mpesa"?"Account: "+ACCOUNT:""].filter(Boolean).join("\\n");
      try{await navigator.clipboard.writeText(text);toast("Order details copied");}catch(e){toast("Copy failed; use the details shown.");}
    };
    $("sendCheckoutOrder").onclick=function(){
      var s=state();
      if(!s.name||!s.phone){toast("Please enter your name and phone number.");return;}
      var msg=["Hi "+STORE+"! I want to place order "+orderRef+".","", "Customer: "+s.name,"Phone: "+s.phone,"",cart.map(function(i){return "• "+i.name+" × "+i.qty+" — "+money(i.price*i.qty);}).join("\\n"),"","Total: "+money(total()),"","Fulfilment: "+(s.delivery==="delivery"?"Home / farm delivery":"Pickup at Lower Kabete"),s.address?"Delivery location: "+s.address:"","", "Payment: "+(s.payment==="mpesa"?"M-Pesa PayBill":"Cash"), s.payment==="mpesa"?"PayBill: "+PAYBILL:"", s.payment==="mpesa"?"Account: "+ACCOUNT:""].filter(Boolean).join("\\n");
      try{localStorage.setItem("farmtek09_last_order",JSON.stringify({orderNumber:orderRef,createdAt:new Date().toISOString(),customer:{name:s.name,phone:s.phone},items:cart,total:total(),fulfilment:s.delivery,deliveryAddress:s.address,paymentMethod:s.payment,status:"Pending"}));}catch(e){}
      window.open(wa(msg),"_blank","noopener");
      cart=[];saveCart();renderCart();closeModal();closeCart();toast("Order sent to WhatsApp");
    };
    $("downloadOrderData").onclick=function(){
      var s=state();if(!s.name||!s.phone){toast("Please enter your name and phone number.");return;}
      var data={orderNumber:orderRef,createdAt:new Date().toISOString(),customer:{name:s.name,phone:s.phone},items:cart,total:total(),fulfilment:s.delivery,deliveryAddress:s.address,paymentMethod:s.payment};
      var blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
      var url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=orderRef+".json";a.click();setTimeout(function(){URL.revokeObjectURL(url);},1000);
    };
  }

  function injectUi(){
    if($("cartDrawer"))return;
    var actions=document.querySelector(".topbar-actions");
    if(!actions){
      actions=document.createElement("div");actions.className="topbar-actions";
      document.querySelector(".topbar-inner").prepend(actions);
    }
    if(!$("cartOpen")){
      var b=document.createElement("button");b.id="cartOpen";b.className="topbar-cart";b.type="button";b.innerHTML='🛒 <span id="cartBadge" hidden>0</span>';actions.prepend(b);
    }
    document.body.insertAdjacentHTML("beforeend",
      '<div id="drawerOverlay" class="overlay" hidden></div>'+
      '<aside id="cartDrawer" class="drawer" aria-label="Shopping cart"><div class="drawer-head"><h2>Your cart</h2><button id="cartClose" class="icon-btn" type="button">×</button></div><div id="cartItems" class="drawer-body"></div><div class="drawer-foot"><div class="total-row"><span>Subtotal</span><strong id="subtotal">Ksh 0</strong></div><button id="checkout" class="btn btn-primary full" type="button">Checkout</button><button id="cartWhatsapp" class="btn btn-whatsapp full" type="button">Order on WhatsApp</button></div></aside>'+
      '<div id="modalOverlay" class="overlay modal-overlay" hidden><section class="modal" role="dialog" aria-modal="true"><button id="modalClose" class="icon-btn modal-x" type="button">×</button><div id="modalContent"></div></section></div>'+
      '<div id="toast" class="toast" hidden></div>');
    $("cartOpen").onclick=openCart;$("cartClose").onclick=closeCart;$("drawerOverlay").onclick=closeCart;$("checkout").onclick=function(){closeCart();checkout();};
    $("cartWhatsapp").onclick=function(){if(cart.length)window.open(wa(quickCartMessage()),"_blank","noopener");};
    $("cartItems").addEventListener("click",function(e){var inc=e.target.closest("[data-cart-inc]"),dec=e.target.closest("[data-cart-dec]");if(inc)adjust(inc.dataset.cartInc,1);if(dec)adjust(dec.dataset.cartDec,-1);});
    $("modalClose").onclick=closeModal;$("modalOverlay").onclick=function(e){if(e.target===$("modalOverlay"))closeModal();};
  }

  function transformCards(){
    document.querySelectorAll(".card[data-product-id]").forEach(function(card){
      if(card.dataset.cartReady==="1")return;
      var p=product(card.dataset.productId),cta=card.querySelector(".card-cta");if(!p||p.price==null||!cta)return;
      var body=card.querySelector(".card-body"),step=document.createElement("div");
      step.className="qty-stepper";step.innerHTML='<button class="qty-btn" type="button" data-card-step="-1">−</button><span class="qty-value">1</span><button class="qty-btn" type="button" data-card-step="1">+</button>';
      var add=document.createElement("button");add.type="button";add.className="btn btn-order card-cta";add.textContent="Add to Cart";add.dataset.addToCart=p.id;
      var quick=document.createElement("a");quick.className="mini-wa";quick.target="_blank";quick.rel="noopener";quick.href=wa(directOrder(p));quick.textContent="Order on WhatsApp";
      cta.replaceWith(step,add,quick);card.dataset.cartReady="1";
      body.addEventListener("click",function(e){
        var stepBtn=e.target.closest("[data-card-step]");
        if(stepBtn){var value=step.querySelector(".qty-value");value.textContent=String(Math.max(1,Number(value.textContent)+Number(stepBtn.dataset.cardStep)));return;}
        var addBtn=e.target.closest("[data-add-to-cart]");
        if(addBtn){add(p.id,Number(step.querySelector(".qty-value").textContent||1));step.querySelector(".qty-value").textContent="1";}
      });
    });
  }
  function directOrder(p){return "Hi! I'd like to order:\\n\\n"+p.name+"\\nPrice: "+money(p.price)+"\\n\\nPlease confirm availability.";}
  function watch(){var grid=$("productGrid");if(!grid)return;transformCards();new MutationObserver(transformCards).observe(grid,{childList:true});}

  function init(){injectUi();watch();renderCart();}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();
