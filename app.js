// app.js - VERSÃO CORRIGIDA E VERIFICADA (CARREGAMENTO FUNCIONANDO)

document.addEventListener('DOMContentLoaded', () => {
    // ▼▼▼ INÍCIO DA CONFIGURAÇÃO E INICIALIZAÇÃO DO FIREBASE ▼▼▼
    const firebaseConfig = {
      apiKey: "AIzaSyAlrFEfblJVGn_EQ-P31OkdOgGcjraYrUI",
      authDomain: "cardapionovo-aec53.firebaseapp.com",
      projectId: "cardapionovo-aec53",
      storageBucket: "cardapionovo-aec53.firebasestorage.app",
      messagingSenderId: "438070835683",
      appId: "1:438070835683:web:bfe502d674da3b924148d6"
    };

    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();
    // ▲▲▲ FIM DA CONFIGURAÇÃO DO FIREBASE ▲▲▲


    // --- 1. ESTADO DA APLICAÇÃO ---
    let cart = [];
    let isStoreOpen = false;
    let manualStatus = 'fechada';

    // --- 2. ELEMENTOS DO DOM (SEÇÃO CORRIGIDA) ---
    const menuContainer = document.getElementById('menu-container');
    const categoryNav = document.getElementById('category-nav');
    const cartBar = document.getElementById('cart-bar');
    const cartPage = document.getElementById('cart-page');
    const cartItemsContainer = document.getElementById('cart-items-container');
    const locationIcon = document.getElementById('location-icon');
    const infoModal = document.getElementById('info-modal');
    const addonModal = document.getElementById('addon-modal');
    const deliveryOptionSelect = document.getElementById('delivery-option');
    const addressFieldsDiv = document.getElementById('address-fields');
    const paymentMethodSelect = document.getElementById('payment-method');
    const changeField = document.getElementById('change-field');
    const pixInfo = document.getElementById('pix-info');
    const pixKeyDisplay = document.getElementById('pix-key-display');
    const copyPixKeyBtn = document.getElementById('copy-pix-key-btn');
    const finalizeOrderBtn = document.getElementById('finalize-order-btn');
    const shareMenuBtn = document.getElementById('share-menu-btn');
    
    // CAMPOS DO FORMULÁRIO
    const clientNameInput = document.getElementById('client-name');
    const clientWhatsappInput = document.getElementById('client-whatsapp');
    const clientStreetInput = document.getElementById('client-street');
    const clientNumberInput = document.getElementById('client-number');
    const clientNeighborhoodInput = document.getElementById('client-neighborhood');
    const changeForInput = document.getElementById('change-for');
    const orderObservationsInput = document.getElementById('order-observations');


    // --- 3. FUNÇÕES DE RENDERIZAÇÃO E LÓGICA ---

    function updateStoreStatus() {
        const storeStatusDiv = document.getElementById('store-status');
        const statusText = document.getElementById('status-text');

        if (!CONFIG.horariosFuncionamento || CONFIG.horariosFuncionamento.length === 0) {
            storeStatusDiv.style.display = 'none';
            return;
        }

        const diasDaSemana = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
        const now = new Date();
        const currentDay = now.getDay();
        const currentTime = now.getHours() + (now.getMinutes() / 60);
        const todaySchedule = CONFIG.horariosFuncionamento.find(h => h.dia === currentDay);
        
        let isWithinSchedule = false;
        if (todaySchedule) {
            const openTime = parseFloat(todaySchedule.abre.replace(':', '.'));
            let closeTime = parseFloat(todaySchedule.fecha.replace(':', '.'));
            if (closeTime === 0) closeTime = 24;

            if (openTime < closeTime) {
                if (currentTime >= openTime && currentTime < closeTime) isWithinSchedule = true;
            } else {
                if (currentTime >= openTime || currentTime < closeTime) isWithinSchedule = true;
            }
        }

        isStoreOpen = (manualStatus === 'aberta') && isWithinSchedule;

        if (isStoreOpen) {
            storeStatusDiv.className = 'store-status open';
            statusText.textContent = 'Aberto agora';
        } else {
            storeStatusDiv.className = 'store-status closed';
            if (manualStatus === 'fechada') {
                statusText.textContent = 'Fechado no momento';
            } else {
                let proximoHorario = null;
                if (todaySchedule && parseFloat(todaySchedule.abre.replace(':', '.')) > currentTime) {
                    proximoHorario = { ...todaySchedule, textoDia: "hoje" };
                }
                if (!proximoHorario) {
                    for (let i = 1; i <= 7; i++) {
                        const proximoDiaIndex = (currentDay + i) % 7;
                        const proximoDiaSchedule = CONFIG.horariosFuncionamento.find(h => h.dia === proximoDiaIndex);
                        if (proximoDiaSchedule) {
                            const nomeDia = (i === 1 && now.getHours() > 5) ? "amanhã" : diasDaSemana[proximoDiaIndex];
                            proximoHorario = { ...proximoDiaSchedule, textoDia: nomeDia };
                            break;
                        }
                    }
                }
                if (proximoHorario) {
                    statusText.textContent = `Fechado • Abre ${proximoHorario.textoDia} às ${proximoHorario.abre}`;
                } else {
                    statusText.textContent = 'Fechado no momento';
                }
            }
        }
        updateCartView();
    }

    function listenToManualStoreStatus() {
        const storeConfigRef = db.collection('configuracoes').doc('loja');
        storeConfigRef.onSnapshot((doc) => {
            if (doc.exists) {
                manualStatus = doc.data().statusManual;
            } else {
                manualStatus = 'fechada';
                console.warn("Documento de configuração da loja não encontrado. A loja permanecerá fechada.");
            }
            updateStoreStatus();
        }, (error) => {
            console.error("Erro ao buscar status da loja. Assumindo como fechada.", error);
            manualStatus = 'fechada';
            updateStoreStatus();
        });
    }

    function setupCategoryObserver() {
        const observerOptions = { root: null, rootMargin: '-20% 0px -80% 0px', threshold: 0 };
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const id = entry.target.getAttribute('id');
                const navLink = document.querySelector(`.category-link[href="#${id}"]`);
                if (entry.isIntersecting && navLink) {
                    document.querySelectorAll('.category-link').forEach(link => link.classList.remove('active'));
                    navLink.classList.add('active');
                }
            });
        }, observerOptions);
        document.querySelectorAll('.category-wrapper').forEach(section => observer.observe(section));
    }

    function loadInitialData() {
        document.title = CONFIG.nomeLoja;
        document.getElementById('store-cover-image').style.backgroundImage = `url('${CONFIG.urlImagemCapa}')`;
        document.getElementById('store-logo-image').src = CONFIG.urlLogoCircular;
        document.getElementById('store-name-title').textContent = CONFIG.nomeLoja;
        document.getElementById('store-subtitle').textContent = CONFIG.subtitulo;
        document.getElementById('copyright-text').textContent = `© ${new Date().getFullYear()} ${CONFIG.nomeLoja}. Todos os direitos reservados.`;
        
        listenToManualStoreStatus();
        
        renderCategoryNav();
        renderMenu();
        renderFooterAndInfoModal();
        if (CONFIG.informacoesLoja.chavePix && CONFIG.informacoesLoja.chavePix.trim() !== '') {
            pixKeyDisplay.textContent = CONFIG.informacoesLoja.chavePix;
        } else {
            const pixOption = paymentMethodSelect.querySelector('option[value="pix"]');
            if (pixOption) pixOption.remove();
        }
        setupCategoryObserver();
    }

    function renderCategoryNav() {
        CONFIG.cardapio.forEach(category => {
            const link = document.createElement('a');
            link.className = 'category-link';
            link.href = `#category-${category.categoria.replace(/\s/g, '-')}`;
            link.textContent = category.categoria;
            categoryNav.appendChild(link);
        });
    }

    function renderMenu() {
        menuContainer.innerHTML = '';
        CONFIG.cardapio.forEach(category => {
            const wrapper = document.createElement('div');
            wrapper.className = 'category-wrapper';
            wrapper.id = `category-${category.categoria.replace(/\s/g, '-')}`;
            let itemsHtml = '';
            category.itens.forEach((item, index) => {
                const itemId = `${category.categoria}-${index}`;
                const [inteiro, centavos] = item.preco.toFixed(2).split('.');
                const hasImage = item.imagem && item.imagem.trim() !== "" && !item.imagem.includes("placeholder");
                if (hasImage) {
                    itemsHtml += `<div class="menu-item com-imagem"><div class="item-details"><h3>${item.nome}</h3><p>${item.descricao}</p><div class="item-price"><span class="currency">R$</span>${inteiro},${centavos}</div></div><div class="item-action"><img src="${item.imagem}" alt="${item.nome}" class="item-image"><button class="add-to-cart-btn" data-item-id="${itemId}">Adicionar</button></div></div>`;
                } else {
                    itemsHtml += `<div class="menu-item sem-imagem"><div class="item-details"><h3>${item.nome}</h3><p>${item.descricao}</p></div><div class="item-action"><div class="item-price"><span class="currency">R$</span>${inteiro},${centavos}</div><button class="add-to-cart-btn" data-item-id="${itemId}">Adicionar</button></div></div>`;
                }
            });
            wrapper.innerHTML = `<h2 class="category-title">${category.categoria}</h2>${itemsHtml}`;
            menuContainer.appendChild(wrapper);
        });
    }

    function renderFooterAndInfoModal() {
        const info = CONFIG.informacoesLoja;
        document.getElementById('instagram-icon').href = info.instagram;
        document.getElementById('facebook-icon').href = info.facebook;
        document.getElementById('whatsapp-icon').href = info.whatsapp;
        document.getElementById('info-modal-body').innerHTML = `<div class="info-block"><i class="fas fa-map-marker-alt"></i> ${info.endereco}</div><div class="info-block"><i class="fas fa-clock"></i> ${info.horario}</div>`;
    }

    function showFeedbackOnButton(button) {
        const originalText = "Adicionar";
        button.disabled = true;
        button.innerHTML = 'Adicionado &check;';
        button.classList.add('item-added');
        setTimeout(() => {
            button.disabled = false;
            button.innerHTML = originalText;
            button.classList.remove('item-added');
        }, 1500);
    }

    function addToCart(itemId, buttonElement) {
        if (!isStoreOpen) {
            alert('A loja está fechada no momento e não aceita pedidos.');
            return;
        }
        const [cat, index] = itemId.split('-');
        const categoryData = CONFIG.cardapio.find(c => c.categoria === cat);
        const itemData = categoryData.itens[index];
        if (categoryData.categoria === 'Adicionais') {
            openAddonModal(itemData);
            return;
        }
        const cartItemId = `item_${new Date().getTime()}`;
        cart.push({ id: itemId, cartItemId: cartItemId, nome: itemData.nome, preco: itemData.preco, quantity: 1, categoria: categoryData.categoria, adicionais: [] });
        updateCartView();
        showFeedbackOnButton(buttonElement);
    }

    function openAddonModal(addonData) {
        const addonModalBody = document.getElementById('addon-modal-body');
        document.getElementById('addon-modal-title').textContent = `Adicionar ${addonData.nome} em:`;
        const compatibleItems = cart.filter(item => addonData.categoriasPermitidas.includes(item.categoria));
        if (compatibleItems.length === 0) {
            addonModalBody.innerHTML = `<p style="text-align: center;">Você precisa adicionar um item compatível (como um Hambúrguer) ao seu pedido antes de incluir um adicional.</p>`;
        } else {
            addonModalBody.innerHTML = '';
            compatibleItems.forEach(item => {
                const btn = document.createElement('button');
                btn.className = 'addon-option-btn';
                btn.textContent = `${item.nome} (Adicionado às ${new Date(parseInt(item.cartItemId.split('_')[1])).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`;
                btn.onclick = () => addAddonToItem(item.cartItemId, addonData);
                addonModalBody.appendChild(btn);
            });
        }
        addonModal.classList.remove('hidden');
    }

    function addAddonToItem(cartItemId, addonData) {
        const mainItem = cart.find(item => item.cartItemId === cartItemId);
        if (mainItem) {
            const existingAddon = mainItem.adicionais.find(ad => ad.nome === addonData.nome);
            if (existingAddon) {
                existingAddon.quantity++;
            } else {
                mainItem.adicionais.push({ nome: addonData.nome, preco: addonData.preco, quantity: 1 });
            }
        }
        addonModal.classList.add('hidden');
        updateCartView();
    }

    window.changeQuantityInCart = function (cartItemId, delta) {
        const item = cart.find(i => i.cartItemId === cartItemId);
        if (item) {
            item.quantity += delta;
            if (item.quantity <= 0) {
                cart = cart.filter(i => i.cartItemId !== cartItemId);
            }
        }
        updateCartView();
    }

    function updateCartView() {
        cartItemsContainer.innerHTML = cart.length === 0 ? '<p style="text-align: center; padding: 20px 0;">Seu carrinho está vazio.</p>' : '';
        let subtotal = 0;
        let totalItems = 0;
        cart.forEach(item => {
            totalItems += item.quantity;
            subtotal += item.preco * item.quantity;
            let addonsHtml = '';
            if (item.adicionais.length > 0) {
                addonsHtml = '<div class="cart-item-addons">';
                item.adicionais.forEach(addon => {
                    subtotal += addon.preco * addon.quantity;
                    addonsHtml += `<span>+ ${addon.quantity}x ${addon.nome}</span><br>`;
                });
                addonsHtml += '</div>';
            }
            cartItemsContainer.innerHTML += `<div class="cart-item-row"><div class="cart-item-main"><div class="cart-item-info"><h4>${item.nome}</h4><span>R$ ${item.preco.toFixed(2).replace('.', ',')}</span></div><div class="quantity-controls"><button onclick="changeQuantityInCart('${item.cartItemId}', -1)">-</button><span>${item.quantity}</span><button onclick="changeQuantityInCart('${item.cartItemId}', 1)">+</button></div></div>${addonsHtml}</div>`;
        });
        document.getElementById('cart-bar-count').textContent = `${totalItems} ${totalItems === 1 ? 'item' : 'itens'}`;
        document.getElementById('cart-bar-total').textContent = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;
        cartBar.classList.toggle('hidden', cart.length === 0 || !isStoreOpen);
        const isDelivery = deliveryOptionSelect.value === 'delivery';
        const deliveryFee = isDelivery ? CONFIG.taxaEntrega : 0;
        const total = subtotal + deliveryFee;
        document.getElementById('cart-subtotal-price').textContent = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;
        document.getElementById('delivery-fee-row').style.display = isDelivery ? 'flex' : 'none';
        document.getElementById('cart-delivery-fee').textContent = `R$ ${deliveryFee.toFixed(2).replace('.', ',')}`;
        document.getElementById('cart-total-price').textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
    }

    function finalizeOrder() {
        if (!isStoreOpen) { alert('A loja está fechada no momento.'); return; }
        if (cart.length === 0) { alert('Seu carrinho está vazio.'); return; }

        const clientName = clientNameInput.value.trim();
        const clientWhatsapp = clientWhatsappInput.value.trim();
        const isDelivery = deliveryOptionSelect.value === 'delivery';
        const street = clientStreetInput.value.trim();
        const number = clientNumberInput.value.trim();
        const neighborhood = clientNeighborhoodInput.value.trim();
        const paymentMethod = paymentMethodSelect.value;
        const changeFor = changeForInput.value.trim();

        if (!clientName) { alert('Por favor, preencha seu nome.'); return; }
        if (!clientWhatsapp || clientWhatsapp.length < 15) { // (XX) XXXXX-XXXX tem 15 chars
            alert('Por favor, preencha um número de WhatsApp válido.'); return;
        }
        if (isDelivery) {
            if (!street) { alert('Por favor, preencha o nome da sua rua.'); return; }
            if (!number) { alert('Por favor, preencha o número da sua casa/apartamento.'); return; }
        }
        if (!paymentMethod) { alert('Escolha a forma de pagamento.'); return; }
        if (paymentMethod === 'dinheiro' && !changeFor) {
            alert('Para pagamento em dinheiro, por favor, informe se precisa de troco e para qual valor.');
            return;
        }

        finalizeOrderBtn.disabled = true;
        finalizeOrderBtn.textContent = 'Enviando...';

        let fullAddress = "Retirar no local";
        if (isDelivery) {
            fullAddress = `${street}, ${number}`;
            if (neighborhood) {
                fullAddress += ` - ${neighborhood}`;
            }
        }

        let subtotal = cart.reduce((sum, item) => { const addonsTotal = item.adicionais.reduce((adSum, ad) => adSum + ad.preco * ad.quantity, 0); return sum + (item.preco * item.quantity) + addonsTotal; }, 0);
        const deliveryFee = isDelivery ? CONFIG.taxaEntrega : 0;
        const total = subtotal + deliveryFee;

        let orderSummary = `*Novo Pedido - ${CONFIG.nomeLoja}*\n\n`;
        orderSummary += `*Cliente:* ${clientName}\n`;
        orderSummary += `*WhatsApp:* ${clientWhatsapp}\n\n`;
        orderSummary += `--- *ITENS* ---\n`;
        cart.forEach(item => { orderSummary += `*${item.quantity}x* ${item.nome}\n`; item.adicionais.forEach(addon => { orderSummary += `  *+ ${addon.quantity}x ${addon.nome}*\n`; }); });
        orderSummary += `\n--- *RESUMO* ---\n*Subtotal:* R$ ${subtotal.toFixed(2).replace('.', ',')}\n`;
        if (isDelivery) { orderSummary += `*Taxa de Entrega:* R$ ${deliveryFee.toFixed(2).replace('.', ',')}\n`; }
        orderSummary += `*TOTAL: R$ ${total.toFixed(2).replace('.', ',')}*\n\n--- *PAGAMENTO E ENTREGA* ---\n`;
        orderSummary += isDelivery ? `*Entrega:* Delivery\n*Endereço:* ${fullAddress}\n` : `*Entrega:* Retirar no local\n`;
        const paymentMethodText = paymentMethodSelect.options[paymentMethodSelect.selectedIndex].text;
        orderSummary += `*Pagamento:* ${paymentMethodText}\n`;
        if (paymentMethod === 'dinheiro') { orderSummary += `*Troco para:* R$ ${changeFor}\n`; }
        const observations = orderObservationsInput.value.trim();
        if (observations) { orderSummary += `*Observações:* ${observations}\n`; }
        
        const whatsappUrl = `https://api.whatsapp.com/send?phone=${CONFIG.telefoneWhatsapp}&text=${encodeURIComponent(orderSummary)}`;
        window.open(whatsappUrl, '_blank');
        
        const orderItems = cart.flatMap(item => { const mainItem = { nome: item.nome, qtd: item.quantity, precoUnit: item.preco }; const addonItems = item.adicionais.map(addon => ({ nome: `+ ${addon.nome}`, qtd: addon.quantity, precoUnit: addon.preco })); return [mainItem, ...addonItems]; });

        const orderData = {
            status: "novo",
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            clienteNome: clientName,
            clienteWhatsapp: clientWhatsapp,
            whatsappLoja: CONFIG.telefoneWhatsapp,
            endereco: fullAddress,
            total: total,
            itens: orderItems,
            pagamento: paymentMethodText,
            observacoes: observations,
            trocoPara: (paymentMethod === 'dinheiro' && changeFor) ? changeFor : null
        };

        db.collection("pedidos").add(orderData).catch((error) => console.error("Erro ao salvar o pedido: ", error));

        alert("Seu pedido foi enviado! Verifique a aba do WhatsApp que abriu para finalizar.");
        
        setTimeout(() => {
            finalizeOrderBtn.disabled = false;
            finalizeOrderBtn.innerHTML = '<i class="fab fa-whatsapp"></i> Enviar Pedido';
            cart = [];
            updateCartView();
            document.getElementById('close-cart-btn').click();
        }, 3000);
    }

    function applyWhatsappMask(input) {
        let value = input.value.replace(/\D/g, '');
        value = value.substring(0, 11);

        let formattedValue = '';
        if (value.length > 0) {
            formattedValue = '(' + value.substring(0, 2);
        }
        if (value.length > 2) {
            formattedValue += ') ' + value.substring(2, 7);
        }
        if (value.length > 7) {
            formattedValue += '-' + value.substring(7, 11);
        }
        input.value = formattedValue;
    }

    // --- 5. EVENT LISTENERS ---
    menuContainer.addEventListener('click', e => { if (e.target.classList.contains('add-to-cart-btn')) { addToCart(e.target.dataset.itemId, e.target); } });
    document.getElementById('view-cart-btn').addEventListener('click', () => cartPage.classList.remove('hidden'));
    document.getElementById('close-cart-btn').addEventListener('click', () => cartPage.classList.add('hidden'));
    deliveryOptionSelect.addEventListener('change', () => { addressFieldsDiv.style.display = deliveryOptionSelect.value === 'delivery' ? 'block' : 'none'; updateCartView(); });
    paymentMethodSelect.addEventListener('change', () => {
        const selectedMethod = paymentMethodSelect.value;
        changeField.classList.toggle('hidden', selectedMethod !== 'dinheiro');
        pixInfo.classList.toggle('hidden', selectedMethod !== 'pix');
    });
    copyPixKeyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(pixKeyDisplay.textContent).then(() => {
            copyPixKeyBtn.innerHTML = '<i class="fas fa-check"></i> Copiado!';
            copyPixKeyBtn.classList.add('copied');
            setTimeout(() => { copyPixKeyBtn.innerHTML = '<i class="fas fa-copy"></i> Copiar'; copyPixKeyBtn.classList.remove('copied'); }, 2000);
        }).catch(err => { alert('Erro ao copiar a chave PIX.'); });
    });
    finalizeOrderBtn.addEventListener('click', finalizeOrder);
    locationIcon.addEventListener('click', () => infoModal.classList.remove('hidden'));
    document.getElementById('close-info-modal').addEventListener('click', () => infoModal.classList.add('hidden'));
    infoModal.addEventListener('click', (e) => { if (e.target === infoModal) infoModal.classList.add('hidden'); });
    document.getElementById('close-addon-modal').addEventListener('click', () => addonModal.classList.add('hidden'));
    addonModal.addEventListener('click', (e) => { if (e.target === addonModal) addonModal.classList.add('hidden'); });
    shareMenuBtn.addEventListener('click', () => {
        const menuUrl = window.location.origin + window.location.pathname;
        const shareText = `Olá! Dê uma olhada no cardápio delicioso do ${CONFIG.nomeLoja}. Faça seu pedido online, é super fácil e rápido! 🍔🍟🥤\n\n${menuUrl}`;
        const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
        window.open(whatsappUrl, '_blank');
    });

    clientWhatsappInput.addEventListener('input', () => {
        applyWhatsappMask(clientWhatsappInput);
    });

    // --- 6. INICIALIZAÇÃO ---
    loadInitialData();
});

// FIM DO ARQUIVO - CÓDIGO COMPLETO E VERIFICADO
