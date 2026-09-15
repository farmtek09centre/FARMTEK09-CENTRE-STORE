/**
 * FARMTEK09 CENTRE — Product catalogue (server copy).
 *
 * This MUST be kept in sync with /products.js at the site root —
 * that one is what the storefront shows to shoppers, this one is
 * what the checkout server trusts for pricing. They're kept as two
 * files (rather than one shared import) so this server can be
 * deployed on its own, separately from the static site.
 *
 * Same placeholder-price warning as the root copy: edit `price`
 * for every item to your real KES price before taking real orders.
 */
const PRODUCTS = [
  { id: "grandnain",  name: "Grand Nain Banana",      price: 200, unit: "seedling", taxTypeCd: "D" },
  { id: "williams",   name: "Williams Hybrid Banana",  price: 200, unit: "seedling", taxTypeCd: "D" },
  { id: "fhia17",     name: "FHIA-17 Banana",          price: 250, unit: "seedling", taxTypeCd: "D" },
  { id: "cavendish",  name: "Giant Cavendish Banana",  price: 200, unit: "seedling", taxTypeCd: "D" },
  { id: "lemon",      name: "Lemon Tree",              price: 350, unit: "seedling", taxTypeCd: "D" },
  { id: "tangerine",  name: "Tangerine Tree",          price: 350, unit: "seedling", taxTypeCd: "D" },
  { id: "apple",      name: "Apple Tree",              price: 400, unit: "seedling", taxTypeCd: "D" },
  { id: "grape",      name: "Grape Vine",              price: 300, unit: "seedling", taxTypeCd: "D" },
  { id: "mango",      name: "Mango Tree",              price: 300, unit: "seedling", taxTypeCd: "D" },
  { id: "avocado",    name: "Avocado Tree",            price: 350, unit: "seedling", taxTypeCd: "D" }
];

module.exports = PRODUCTS;
