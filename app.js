document.addEventListener('DOMContentLoaded', () => {
  // --- State ---
  let currentCategory = 'noodles';
  let order = [];
  let activeTableNum = null; // Track if editing a specific table

  // Menu Settings Category State
  let settingsCategory = 'noodles';

  // Load and Initialize Tables Data (1 to 12 tables)
  let tableData = JSON.parse(localStorage.getItem('pos_table_data')) || 
    Array.from({ length: 12 }, (_, i) => ({ id: i + 1, status: 'empty', order: [] }));

  // Load and Initialize Order History
  let orderHistory = JSON.parse(localStorage.getItem('pos_order_history')) || [];

  // Modal State for Noodles
  let activeNoodle = null;
  let selectedSize = 'small';
  let selectedStyle = 'soup';
  let selectedTexture = '適中';
  let selectedSpicy = '不辣';

  // --- DOM Elements ---
  const menuGrid = document.getElementById('menu-grid');
  const tabs = document.querySelectorAll('.tab');
  const orderItemsContainer = document.getElementById('order-items');
  const totalAmountEl = document.getElementById('total-amount');
  const takeoutCheckbox = document.getElementById('takeout-checkbox');
  const tableNumberInput = document.getElementById('table-number');
  const orderTitleDisplay = document.getElementById('order-title-display');

  // Navigation Tab Buttons & Views
  const navBtns = document.querySelectorAll('.nav-btn');
  const viewContents = document.querySelectorAll('.view-content');

  // Tables View Grid
  const tablesGrid = document.getElementById('tables-grid');

  // History View Stats & Table
  const statRevenueEl = document.getElementById('stat-revenue');
  const statOrdersEl = document.getElementById('stat-orders');
  const statAvgOrderEl = document.getElementById('stat-avg-order');
  const historyTbody = document.getElementById('history-tbody');
  const btnClearHistory = document.getElementById('btn-clear-history');

  // Noodle Modal Extra Customizations
  const noodleModal = document.getElementById('noodle-modal');
  const modalNoodleName = document.getElementById('modal-noodle-name');
  const priceSmallEl = document.getElementById('price-small');
  const priceLargeEl = document.getElementById('price-large');
  const sizeBtns = document.querySelectorAll('#size-group .toggle-btn');
  const styleBtns = document.querySelectorAll('#style-group .toggle-btn');
  const textureBtns = document.querySelectorAll('#texture-group .toggle-btn');
  const spicyBtns = document.querySelectorAll('#spicy-group .toggle-btn');
  const addEggCheckbox = document.getElementById('add-egg-checkbox');
  const addMeatballCheckbox = document.getElementById('add-meatball-checkbox');
  const btnCancelNoodle = document.getElementById('btn-cancel-noodle');
  const btnConfirmNoodle = document.getElementById('btn-confirm-noodle');

  // Other Modal
  const otherModal = document.getElementById('other-modal');
  const customNameInput = document.getElementById('custom-name');
  const customPriceInput = document.getElementById('custom-price');
  const btnCancelOther = document.getElementById('btn-cancel-other');
  const btnConfirmOther = document.getElementById('btn-confirm-other');

  // Receipt Modal
  const receiptModal = document.getElementById('receipt-modal');
  const receiptIdEl = document.getElementById('receipt-id');
  const receiptTimeEl = document.getElementById('receipt-time');
  const receiptTypeEl = document.getElementById('receipt-type');
  const receiptTableEl = document.getElementById('receipt-table');
  const receiptItemsContainer = document.getElementById('receipt-items-container');
  const receiptTotalAmountEl = document.getElementById('receipt-total-amount');
  const btnCloseReceipt = document.getElementById('btn-close-receipt');
  const btnPrintReceipt = document.getElementById('btn-print-receipt');

  // Settings Menu Management Form & List
  const menuItemForm = document.getElementById('menu-item-form');
  const editItemIdInput = document.getElementById('edit-item-id');
  const itemCategorySelect = document.getElementById('item-category');
  const itemNameInput = document.getElementById('item-name');
  const itemPriceInput = document.getElementById('item-price');
  const itemPriceSmallInput = document.getElementById('item-price-small');
  const itemPriceLargeInput = document.getElementById('item-price-large');
  const priceStandardGroup = document.getElementById('price-standard-group');
  const priceNoodleGroup = document.getElementById('price-noodle-group');
  const settingsCategoryTabs = document.querySelectorAll('#settings-category-tabs .settings-tab');
  const settingsItemsList = document.getElementById('settings-items-list');
  const btnResetForm = document.getElementById('btn-reset-form');

  // --- Initialization ---
  renderMenu();
  renderTables();
  renderHistory();
  renderSettingsItems();

  // --- Functions: Persistence & Sync ---
  function saveTableData() {
    localStorage.setItem('pos_table_data', JSON.stringify(tableData));
  }

  function saveHistoryData() {
    localStorage.setItem('pos_order_history', JSON.stringify(orderHistory));
  }

  function syncCartToTable() {
    const tableNum = parseInt(tableNumberInput.value);
    const isTakeout = takeoutCheckbox.checked;
    
    // Clear previously active table status if it's different now
    if (isTakeout || isNaN(tableNum) || tableNum < 1 || tableNum > 12) {
      if (activeTableNum) {
        const tIndex = activeTableNum - 1;
        tableData[tIndex].order = [];
        tableData[tIndex].status = 'empty';
        saveTableData();
        renderTables();
        activeTableNum = null;
      }
      return;
    }

    const tIndex = tableNum - 1;
    tableData[tIndex].order = order;
    tableData[tIndex].status = order.length > 0 ? 'occupied' : 'empty';
    activeTableNum = tableNum;
    saveTableData();
    renderTables();
  }

  // --- Event Listeners: Navigation ---
  navBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const targetTab = e.target.dataset.tab;
      
      navBtns.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');

      viewContents.forEach(view => {
        if (view.id === `${targetTab}-view`) {
          view.classList.remove('hidden');
        } else {
          view.classList.add('hidden');
        }
      });

      // Refresh screens on navigation
      if (targetTab === 'tables') renderTables();
      if (targetTab === 'history') renderHistory();
      if (targetTab === 'settings') {
        resetSettingsForm();
        renderSettingsItems();
      }
    });
  });

  // --- Event Listeners: Ordering ---
  
  // Category Tabs
  tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      tabs.forEach(t => t.classList.remove('active'));
      e.target.classList.add('active');
      currentCategory = e.target.dataset.category;
      renderMenu();
    });
  });

  // Takeout Checkbox Toggle
  takeoutCheckbox.addEventListener('change', () => {
    if (takeoutCheckbox.checked) {
      tableNumberInput.value = '';
      tableNumberInput.disabled = true;
      orderTitleDisplay.textContent = '點餐系統 (外帶)';
    } else {
      tableNumberInput.disabled = false;
      const num = tableNumberInput.value;
      orderTitleDisplay.textContent = num ? `點餐系統 (${num} 桌)` : '點餐系統 (內用)';
    }
    syncCartToTable();
  });

  // Table Number Input Change
  tableNumberInput.addEventListener('input', (e) => {
    const val = e.target.value.trim();
    if (val) {
      takeoutCheckbox.checked = false;
      orderTitleDisplay.textContent = `點餐系統 (${val} 桌)`;
      
      // If table exists, check if we need to load its existing order
      const tNum = parseInt(val);
      if (tNum >= 1 && tNum <= 12) {
        const tIndex = tNum - 1;
        // If there's an order on this table and our current cart is empty, load it
        if (tableData[tIndex].order.length > 0 && order.length === 0) {
          order = JSON.parse(JSON.stringify(tableData[tIndex].order));
          renderOrder();
        }
        activeTableNum = tNum;
      }
    } else {
      orderTitleDisplay.textContent = '點餐系統 (內用)';
      activeTableNum = null;
    }
    syncCartToTable();
  });

  // --- Event Listeners: Noodle Modal ---
  sizeBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      sizeBtns.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      selectedSize = e.target.dataset.value;
    });
  });

  styleBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      styleBtns.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      selectedStyle = e.target.dataset.value;
    });
  });

  textureBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      textureBtns.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      selectedTexture = e.target.dataset.value;
    });
  });

  spicyBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      spicyBtns.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      selectedSpicy = e.target.dataset.value;
    });
  });

  btnCancelNoodle.addEventListener('click', closeNoodleModal);
  btnConfirmNoodle.addEventListener('click', () => {
    if (!activeNoodle) return;
    
    let basePrice = selectedSize === 'small' ? activeNoodle.priceSmall : activeNoodle.priceLarge;
    const sizeText = selectedSize === 'small' ? '小' : '大';
    const styleText = selectedStyle === 'soup' ? '湯' : '乾';
    
    // Additional addons cost
    let addonPrice = 0;
    let addons = [];
    if (addEggCheckbox.checked) {
      addonPrice += 10;
      addons.push("加滷蛋");
    }
    if (addMeatballCheckbox.checked) {
      addonPrice += 15;
      addons.push("加貢丸");
    }

    const finalPrice = basePrice + addonPrice;
    
    // Details string
    let descParts = [sizeText, styleText, selectedTexture, selectedSpicy];
    if (addons.length > 0) {
      descParts.push(addons.join("、"));
    }
    const fullDesc = descParts.join(" / ");
    
    // Check if duplicate spec is already in cart
    const existingIndex = order.findIndex(item => 
      item.id === activeNoodle.id && 
      item.size === selectedSize && 
      item.style === selectedStyle &&
      item.texture === selectedTexture &&
      item.spicy === selectedSpicy &&
      item.addEgg === addEggCheckbox.checked &&
      item.addMeatball === addMeatballCheckbox.checked
    );

    if (existingIndex > -1) {
      order[existingIndex].quantity += 1;
    } else {
      order.push({
        id: activeNoodle.id,
        name: activeNoodle.name,
        desc: fullDesc,
        price: finalPrice,
        quantity: 1,
        size: selectedSize,
        style: selectedStyle,
        texture: selectedTexture,
        spicy: selectedSpicy,
        addEgg: addEggCheckbox.checked,
        addMeatball: addMeatballCheckbox.checked,
        type: 'noodle'
      });
    }

    closeNoodleModal();
    renderOrder();
    syncCartToTable();
  });

  // --- Event Listeners: Other Item Modal ---
  btnCancelOther.addEventListener('click', closeOtherModal);
  btnConfirmOther.addEventListener('click', () => {
    const name = customNameInput.value.trim() || '自訂項目';
    const price = parseInt(customPriceInput.value) || 0;
    
    order.push({
      id: 'custom_' + Date.now(),
      name: name,
      desc: '自訂其他',
      price: price,
      quantity: 1,
      type: 'other'
    });

    closeOtherModal();
    renderOrder();
    syncCartToTable();
  });

  // --- Checkout Logic & Receipt ---
  document.getElementById('btn-checkout').addEventListener('click', () => {
    if (order.length === 0) {
      alert("購物車是空的！");
      return;
    }
    
    const isTakeout = takeoutCheckbox.checked;
    const tableNum = tableNumberInput.value.trim();
    const total = order.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const transactionId = 'TX-' + Date.now().toString().slice(-6);
    const timeStr = new Date().toLocaleString('zh-TW');

    // Create checkout record
    const checkoutRecord = {
      id: transactionId,
      time: timeStr,
      type: isTakeout ? '外帶' : '內用',
      table: isTakeout ? '-' : (tableNum || '未填'),
      items: JSON.parse(JSON.stringify(order)),
      total: total
    };

    // Save to History
    orderHistory.unshift(checkoutRecord);
    saveHistoryData();

    // Load into receipt modal
    receiptIdEl.textContent = transactionId;
    receiptTimeEl.textContent = timeStr;
    receiptTypeEl.textContent = checkoutRecord.type;
    receiptTableEl.textContent = checkoutRecord.table;
    
    // Draw receipt items
    receiptItemsContainer.innerHTML = '';
    order.forEach(item => {
      const row = document.createElement('div');
      row.className = 'receipt-item-row';
      row.innerHTML = `
        <div class="receipt-item-row-left">
          <span>${item.name}</span>
          <span class="receipt-item-subdesc">${item.desc || ''}</span>
        </div>
        <span class="receipt-item-qty">${item.quantity}</span>
        <span class="receipt-item-subtotal">$${item.price * item.quantity}</span>
      `;
      receiptItemsContainer.appendChild(row);
    });
    
    receiptTotalAmountEl.textContent = `$${total}`;

    // Pop the Receipt Modal
    receiptModal.classList.remove('hidden');

    // Clear active table cache if it was inner table
    if (!isTakeout && tableNum) {
      const tNum = parseInt(tableNum);
      if (tNum >= 1 && tNum <= 12) {
        tableData[tNum - 1].order = [];
        tableData[tNum - 1].status = 'empty';
        saveTableData();
      }
    }

    // Reset shopping cart state
    order = [];
    takeoutCheckbox.checked = false;
    tableNumberInput.value = '';
    tableNumberInput.disabled = false;
    orderTitleDisplay.textContent = '點餐系統 (外帶)';
    activeTableNum = null;
    
    renderOrder();
    renderTables();
    renderHistory();
  });

  // Receipt Modal Actions
  btnCloseReceipt.addEventListener('click', () => {
    receiptModal.classList.add('hidden');
  });

  btnPrintReceipt.addEventListener('click', () => {
    window.print();
  });

  // --- Functions: Rendering Menu ---
  function renderMenu() {
    menuGrid.innerHTML = '';
    const items = menuData[currentCategory] || [];

    items.forEach(item => {
      const btn = document.createElement('button');
      btn.className = 'menu-item-btn';
      
      const nameEl = document.createElement('span');
      nameEl.className = 'item-name';
      nameEl.textContent = item.name;
      btn.appendChild(nameEl);

      const priceEl = document.createElement('span');
      if (currentCategory === 'noodles') {
        priceEl.className = 'item-price range';
        priceEl.textContent = `小 ${item.priceSmall} / 大 ${item.priceLarge}`;
      } else {
        priceEl.className = 'item-price';
        priceEl.textContent = `$${item.price}`;
      }
      btn.appendChild(priceEl);

      btn.addEventListener('click', () => handleItemClick(item, currentCategory));
      menuGrid.appendChild(btn);
    });

    // Add "Other" custom button for food categories
    const otherBtn = document.createElement('button');
    otherBtn.className = 'menu-item-btn';
    otherBtn.innerHTML = `
      <span class="item-name">自訂項目</span>
      <span class="item-price range">自訂金額</span>
    `;
    otherBtn.addEventListener('click', openOtherModal);
    menuGrid.appendChild(otherBtn);
  }

  function handleItemClick(item, category) {
    if (category === 'noodles') {
      openNoodleModal(item);
    } else {
      // Direct add to cart for sides & soups
      const existingIndex = order.findIndex(o => o.id === item.id);
      if (existingIndex > -1) {
        order[existingIndex].quantity += 1;
      } else {
        order.push({
          id: item.id,
          name: item.name,
          desc: category === 'sides' ? '小菜' : '湯類',
          price: item.price,
          quantity: 1,
          type: category
        });
      }
      renderOrder();
      syncCartToTable();
    }
  }

  function renderOrder() {
    orderItemsContainer.innerHTML = '';
    let total = 0;

    if (order.length === 0) {
      orderItemsContainer.innerHTML = '<div class="empty-state">購物車是空的</div>';
      totalAmountEl.textContent = '$0';
      return;
    }

    order.forEach((item, index) => {
      total += item.price * item.quantity;
      
      const itemEl = document.createElement('div');
      itemEl.className = 'order-item';
      itemEl.innerHTML = `
        <div class="item-info">
          <span class="item-title">${item.name}</span>
          <span class="item-desc">${item.desc}</span>
        </div>
        <div class="item-actions">
          <div class="qty-control">
            <button class="btn-qty" onclick="window.updateQty(${index}, -1)">-</button>
            <span>${item.quantity}</span>
            <button class="btn-qty" onclick="window.updateQty(${index}, 1)">+</button>
          </div>
          <span class="item-total">$${item.price * item.quantity}</span>
          <button class="btn-delete" onclick="window.removeItem(${index})">✕</button>
        </div>
      `;
      orderItemsContainer.appendChild(itemEl);
    });

    totalAmountEl.textContent = `$${total}`;
  }

  // Exposed globally for cart buttons
  window.updateQty = (index, change) => {
    if (order[index].quantity + change > 0) {
      order[index].quantity += change;
    } else if (order[index].quantity + change === 0) {
      order.splice(index, 1);
    }
    renderOrder();
    syncCartToTable();
  };

  window.removeItem = (index) => {
    order.splice(index, 1);
    renderOrder();
    syncCartToTable();
  };

  // --- Functions: Tables Visual View ---
  function renderTables() {
    tablesGrid.innerHTML = '';
    tableData.forEach(table => {
      const card = document.createElement('div');
      card.className = `table-card glass-panel ${table.status}`;
      
      const hasOrder = table.order && table.order.length > 0;
      const orderTotal = hasOrder ? table.order.reduce((sum, item) => sum + (item.price * item.quantity), 0) : 0;
      
      card.innerHTML = `
        <div class="table-card-header">
          <h3 class="table-card-title">${table.id} 號桌</h3>
          <span class="table-status-badge">${table.status === 'occupied' ? '用餐中' : '空桌'}</span>
        </div>
        <div class="table-card-body">
          ${table.status === 'occupied' 
            ? `<span class="table-amount-display">$${orderTotal}</span><br>已點 ${table.order.length} 品項` 
            : '暫無點餐資料'}
        </div>
        <div class="table-card-actions">
          <button class="btn-table-action btn-confirm">${table.status === 'occupied' ? '編輯餐點' : '開始點餐'}</button>
          ${table.status === 'occupied' ? `<button class="btn-table-action btn-cancel btn-table-checkout" data-id="${table.id}">結帳</button>` : ''}
        </div>
      `;

      // Click action for card or main button: load table details
      card.querySelector('.btn-confirm').addEventListener('click', (e) => {
        e.stopPropagation();
        loadTableOrderToCart(table.id);
      });

      card.addEventListener('click', () => {
        loadTableOrderToCart(table.id);
      });

      // Quick checkout from table card
      if (table.status === 'occupied') {
        card.querySelector('.btn-table-checkout').addEventListener('click', (e) => {
          e.stopPropagation();
          loadTableOrderToCart(table.id);
          document.getElementById('btn-checkout').click();
        });
      }

      tablesGrid.appendChild(card);
    });
  }

  function loadTableOrderToCart(tableId) {
    const tIndex = tableId - 1;
    // Set table controls
    takeoutCheckbox.checked = false;
    tableNumberInput.disabled = false;
    tableNumberInput.value = tableId;
    orderTitleDisplay.textContent = `點餐系統 (${tableId} 桌)`;
    
    // Set active table order
    order = JSON.parse(JSON.stringify(tableData[tIndex].order || []));
    activeTableNum = tableId;
    
    renderOrder();
    
    // Automically switch to order tab
    const orderTabBtn = document.querySelector('.nav-btn[data-tab="order"]');
    if (orderTabBtn) orderTabBtn.click();
  }

  // --- Functions: History View & Stats ---
  function renderHistory() {
    historyTbody.innerHTML = '';
    
    let totalRevenue = 0;
    let totalOrders = orderHistory.length;
    
    orderHistory.forEach(record => {
      totalRevenue += record.total;
      
      const tr = document.createElement('tr');
      
      // Map items to visual bubbles
      const itemsBubbles = record.items.map(item => {
        return `<span class="item-desc-bubble">${item.name} (${item.desc || ''}) x ${item.quantity}</span>`;
      }).join(' ');

      tr.innerHTML = `
        <td><strong>${record.id}</strong></td>
        <td>${record.time}</td>
        <td>${record.type}</td>
        <td>${record.table}</td>
        <td>${itemsBubbles}</td>
        <td><strong>$${record.total}</strong></td>
        <td>
          <button class="btn-sm btn-edit btn-reprint-receipt" data-id="${record.id}">列印</button>
          <button class="btn-sm btn-delete-sm btn-delete-history" data-id="${record.id}">刪除</button>
        </td>
      `;

      // Reprint listener
      tr.querySelector('.btn-reprint-receipt').addEventListener('click', () => {
        reprintReceipt(record);
      });

      // Delete item listener
      tr.querySelector('.btn-delete-history').addEventListener('click', () => {
        if (confirm(`確定要刪除該筆訂單紀錄 (${record.id}) 嗎？`)) {
          orderHistory = orderHistory.filter(r => r.id !== record.id);
          saveHistoryData();
          renderHistory();
        }
      });

      historyTbody.appendChild(tr);
    });

    const avgPrice = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
    
    statRevenueEl.textContent = `$${totalRevenue}`;
    statOrdersEl.textContent = totalOrders;
    statAvgOrderEl.textContent = `$${avgPrice}`;
  }

  function reprintReceipt(record) {
    receiptIdEl.textContent = record.id;
    receiptTimeEl.textContent = record.time;
    receiptTypeEl.textContent = record.type;
    receiptTableEl.textContent = record.table;
    
    receiptItemsContainer.innerHTML = '';
    record.items.forEach(item => {
      const row = document.createElement('div');
      row.className = 'receipt-item-row';
      row.innerHTML = `
        <div class="receipt-item-row-left">
          <span>${item.name}</span>
          <span class="receipt-item-subdesc">${item.desc || ''}</span>
        </div>
        <span class="receipt-item-qty">${item.quantity}</span>
        <span class="receipt-item-subtotal">$${item.price * item.quantity}</span>
      `;
      receiptItemsContainer.appendChild(row);
    });
    
    receiptTotalAmountEl.textContent = `$${record.total}`;
    receiptModal.classList.remove('hidden');
  }

  // Clear History
  btnClearHistory.addEventListener('click', () => {
    if (confirm("您確定要清除所有的歷史訂單與營業統計資料嗎？這項動作無法還原！")) {
      orderHistory = [];
      saveHistoryData();
      renderHistory();
    }
  });

  // --- Functions: Noodle Modal ---
  function openNoodleModal(item) {
    activeNoodle = item;
    modalNoodleName.textContent = item.name;
    priceSmallEl.textContent = `$${item.priceSmall}`;
    priceLargeEl.textContent = `$${item.priceLarge}`;
    
    // Reset selections
    selectedSize = 'small';
    selectedStyle = 'soup';
    selectedTexture = '適中';
    selectedSpicy = '不辣';
    addEggCheckbox.checked = false;
    addMeatballCheckbox.checked = false;

    sizeBtns.forEach(b => b.classList.remove('active'));
    styleBtns.forEach(b => b.classList.remove('active'));
    textureBtns.forEach(b => b.classList.remove('active'));
    spicyBtns.forEach(b => b.classList.remove('active'));

    sizeBtns[0].classList.add('active'); // Small
    styleBtns[0].classList.add('active'); // Soup
    textureBtns[0].classList.add('active'); // Medium texture
    spicyBtns[0].classList.add('active'); // None spicy

    noodleModal.classList.remove('hidden');
  }

  function closeNoodleModal() {
    noodleModal.classList.add('hidden');
    activeNoodle = null;
  }

  function openOtherModal() {
    customNameInput.value = '';
    customPriceInput.value = '';
    otherModal.classList.remove('hidden');
    customNameInput.focus();
  }

  function closeOtherModal() {
    otherModal.classList.add('hidden');
  }

  // --- Functions: Settings Menu Management CRUD ---
  
  // Toggle form layout based on selected Category
  itemCategorySelect.addEventListener('change', (e) => {
    toggleFormFields(e.target.value);
  });

  function toggleFormFields(category) {
    if (category === 'noodles') {
      priceStandardGroup.classList.add('hidden');
      priceNoodleGroup.classList.remove('hidden');
      itemPriceInput.removeAttribute('required');
      itemPriceSmallInput.setAttribute('required', 'true');
      itemPriceLargeInput.setAttribute('required', 'true');
    } else {
      priceStandardGroup.classList.remove('hidden');
      priceNoodleGroup.classList.add('hidden');
      itemPriceInput.setAttribute('required', 'true');
      itemPriceSmallInput.removeAttribute('required');
      itemPriceLargeInput.removeAttribute('required');
    }
  }

  // Form Submit: Add or Edit Menu Item
  menuItemForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const id = editItemIdInput.value;
    const category = itemCategorySelect.value;
    const name = itemNameInput.value.trim();
    
    let newItem = {
      name: name
    };

    if (category === 'noodles') {
      newItem.priceSmall = parseInt(itemPriceSmallInput.value);
      newItem.priceLarge = parseInt(itemPriceLargeInput.value);
    } else {
      newItem.price = parseInt(itemPriceInput.value);
    }

    // Edit mode
    if (id) {
      newItem.id = id;
      const index = menuData[category].findIndex(item => item.id === id);
      if (index > -1) {
        menuData[category][index] = newItem;
      }
    } else {
      // Add mode
      newItem.id = (category === 'noodles' ? 'n' : (category === 'sides' ? 's' : 'p')) + Date.now();
      menuData[category].push(newItem);
    }

    // Save
    window.saveMenuData(menuData);

    // Reset and Render
    resetSettingsForm();
    renderMenu();
    renderSettingsItems();
    alert("菜單儲存成功！");
  });

  // Reset form
  btnResetForm.addEventListener('click', resetSettingsForm);

  function resetSettingsForm() {
    menuItemForm.reset();
    editItemIdInput.value = '';
    document.getElementById('settings-form-title').textContent = '新增品項';
    toggleFormFields('noodles'); // default
  }

  // Category Tabs in Admin List
  settingsCategoryTabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      settingsCategoryTabs.forEach(t => t.classList.remove('active'));
      e.target.classList.add('active');
      settingsCategory = e.target.dataset.category;
      renderSettingsItems();
    });
  });

  // Render Admin list items
  function renderSettingsItems() {
    settingsItemsList.innerHTML = '';
    const items = menuData[settingsCategory] || [];

    if (items.length === 0) {
      settingsItemsList.innerHTML = '<div class="empty-state">此分類目前無商品</div>';
      return;
    }

    items.forEach(item => {
      const row = document.createElement('div');
      row.className = 'settings-item-row';
      
      const isNoodle = settingsCategory === 'noodles';
      const priceText = isNoodle 
        ? `小: $${item.priceSmall} / 大: $${item.priceLarge}` 
        : `$${item.price}`;
      
      row.innerHTML = `
        <div class="settings-item-info">
          <span class="settings-item-name">${item.name}</span>
          <span class="settings-item-price">${priceText}</span>
        </div>
        <div class="settings-item-actions">
          <button class="btn-sm btn-edit btn-item-edit" data-id="${item.id}">編輯</button>
          <button class="btn-sm btn-delete-sm btn-item-delete" data-id="${item.id}">刪除</button>
        </div>
      `;

      // Edit click handler
      row.querySelector('.btn-item-edit').addEventListener('click', () => {
        document.getElementById('settings-form-title').textContent = '編輯品項';
        editItemIdInput.value = item.id;
        itemCategorySelect.value = settingsCategory;
        itemNameInput.value = item.name;
        
        toggleFormFields(settingsCategory);
        
        if (isNoodle) {
          itemPriceSmallInput.value = item.priceSmall;
          itemPriceLargeInput.value = item.priceLarge;
        } else {
          itemPriceInput.value = item.price;
        }
        itemNameInput.focus();
      });

      // Delete click handler
      row.querySelector('.btn-item-delete').addEventListener('click', () => {
        if (confirm(`確定要將商品「${item.name}」從菜單中移除嗎？`)) {
          menuData[settingsCategory] = menuData[settingsCategory].filter(i => i.id !== item.id);
          window.saveMenuData(menuData);
          renderMenu();
          renderSettingsItems();
          resetSettingsForm();
        }
      });

      settingsItemsList.appendChild(row);
    });
  }
});
