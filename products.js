/**
 * FARMTEK09 CENTRE — shared GitHub catalogue.
 * This is the source of truth for the customer storefront and checkout.
 * The admin dashboard edits this file directly through the GitHub Contents API.
 */
const PRODUCTS = [
  { id:"grandnain", name:"Grand Nain Banana", price:200, unit:"seedling", stock:20, image:"https://upload.wikimedia.org/wikipedia/commons/3/3c/Banana_tree.jpg", description:"Healthy tissue-culture Grand Nain banana seedlings." },
  { id:"williams", name:"Williams Hybrid Banana", price:200, unit:"seedling", stock:20, image:"https://upload.wikimedia.org/wikipedia/commons/f/fc/Banana_Plant_tree.jpg", description:"Williams hybrid banana seedlings for productive farms." },
  { id:"fhia17", name:"FHIA-17 Banana", price:250, unit:"seedling", stock:20, image:"https://upload.wikimedia.org/wikipedia/commons/1/1a/Banana_tree_fruit.jpg", description:"FHIA-17 tissue-culture banana seedlings." },
  { id:"cavendish", name:"Giant Cavendish Banana", price:200, unit:"seedling", stock:20, image:"https://upload.wikimedia.org/wikipedia/commons/5/51/Banana_tree_with_bunch.jpg", description:"Giant Cavendish banana seedlings." },
  { id:"lemon", name:"Lemon Tree", price:350, unit:"seedling", stock:20, image:"https://upload.wikimedia.org/wikipedia/commons/0/0c/Lemon_tree.jpg", description:"Grafted lemon seedlings for home gardens and farms." },
  { id:"tangerine", name:"Tangerine Tree", price:350, unit:"seedling", stock:20, image:"https://upload.wikimedia.org/wikipedia/commons/0/05/Tangerine_tree.jpg", description:"Healthy tangerine seedlings." },
  { id:"apple", name:"Apple Tree", price:400, unit:"seedling", stock:20, image:"https://upload.wikimedia.org/wikipedia/commons/5/55/Apple_tree.jpg", description:"Apple seedlings suitable for highland growing conditions." },
  { id:"grape", name:"Grape Vine", price:300, unit:"seedling", stock:20, image:"https://upload.wikimedia.org/wikipedia/commons/9/9f/Grapevine.jpg", description:"Grape vines for farms and home gardens." },
  { id:"mango", name:"Mango Tree", price:300, unit:"seedling", stock:20, image:"https://upload.wikimedia.org/wikipedia/commons/5/59/Mango_tree.jpg", description:"Quality mango grafted seedlings." },
  { id:"avocado", name:"Avocado Tree", price:350, unit:"seedling", stock:20, image:"https://upload.wikimedia.org/wikipedia/commons/3/3b/Avocado_tree.jpg", description:"Quality avocado seedlings for farmers and home growers." }
];

if (typeof module !== "undefined") module.exports = PRODUCTS;
