const defaultMenuData = {
  noodles: [
    { id: "n1", name: "玉里麵", priceSmall: 50, priceLarge: 70 },
    { id: "n2", name: "白麵", priceSmall: 50, priceLarge: 70 },
    { id: "n3", name: "米粉", priceSmall: 50, priceLarge: 70 },
    { id: "n4", name: "冬粉", priceSmall: 50, priceLarge: 70 },
    { id: "n5", name: "米苔目", priceSmall: 50, priceLarge: 70 },
    { id: "n6", name: "粿仔條", priceSmall: 50, priceLarge: 70 },
    { id: "n7", name: "餛飩麵", priceSmall: 60, priceLarge: 80 },
    { id: "n8", name: "餛飩白麵", priceSmall: 60, priceLarge: 80 },
    { id: "n9", name: "餛飩米粉", priceSmall: 60, priceLarge: 80 },
  ],
  sides: [
    { id: "s1", name: "綜合滷味", price: 100 },
    { id: "s2", name: "粉腸", price: 50 },
    { id: "s3", name: "肝連", price: 50 },
    { id: "s4", name: "豬頭皮", price: 50 },
    { id: "s5", name: "滷蛋1顆", price: 10 },
    { id: "s6", name: "海帶2個", price: 30 },
    { id: "s7", name: "豆干3片", price: 20 },
    { id: "s8", name: "燙青菜", price: 50 },
  ],
  soups: [
    { id: "p1", name: "餛飩湯(大)", price: 70 },
    { id: "p2", name: "餛飩湯(小)", price: 50 },
    { id: "p3", name: "粉腸湯", price: 50 },
    { id: "p4", name: "肝連湯", price: 50 },
    { id: "p5", name: "貢丸湯", price: 50 },
  ]
};

let menuData = JSON.parse(localStorage.getItem('pos_menu_data')) || defaultMenuData;

// If it's not in localStorage yet, initialize it
if (!localStorage.getItem('pos_menu_data')) {
  localStorage.setItem('pos_menu_data', JSON.stringify(menuData));
}

// Helper function to save menu updates
window.saveMenuData = (newMenu) => {
  menuData = newMenu;
  localStorage.setItem('pos_menu_data', JSON.stringify(menuData));
};

