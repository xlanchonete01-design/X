// admin.js - VERSÃO FINAL COM LÓGICA DE AUTOCORREÇÃO

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
    const auth = firebase.auth();
    // ▲▲▲ FIM DA CONFIGURAÇÃO DO FIREBASE ▲▲▲


    // --- ESTADO GLOBAL ---
    let bluetoothDevice = null;
    let printCharacteristic = null;
    let currentOrderToPrint = null;
    let printedOrderIds = new Set();

    // --- ELEMENTOS DO DOM ---
    const loginContainer = document.getElementById('login-container');
    const adminPanel = document.getElementById('admin-panel');
    const loginButton = document.getElementById('login-button');
    const loginEmailInput = document.getElementById('login-email');
    const loginPasswordInput = document.getElementById('login-password');
    const loginErrorMessage = document.getElementById('login-error-message');
    const connectPrinterBtn = document.getElementById('connect-printer-btn');
    const containerNew = document.getElementById('container-new');
    const containerPrep = document.getElementById('container-prep');
    const containerReady = document.getElementById('container-ready');
    const newOrdersCount = document.getElementById('new-orders-count');
    const prepOrdersCount = document.getElementById('prep-orders-count');
    const readyOrdersCount = document.getElementById('ready-orders-count');
    const printPreviewModal = document.getElementById('print-preview-modal');
    const printPreviewContent = document.getElementById('print-preview-content');
    const closePreviewBtn = document.getElementById('close-preview-btn');
    const confirmPrintBtn = document.getElementById('confirm-print-btn');
    const userMenuBtn = document.getElementById('user-menu-btn');
    const userDropdown = document.getElementById('user-dropdown');
    const userEmailDisplay = document.getElementById('user-email-display');
    const logoutButton = document.getElementById('logout-button');
    const storeStatusToggle = document.getElementById('store-status-toggle');
    const storeStatusText = document.getElementById('store-status-text');


    // --- LÓGICA PRINCIPAL DE INICIALIZAÇÃO ---
    setupGlobalEventListeners();

    auth.onAuthStateChanged(user => {
        if (user) {
            initializeApp(user);
        } else {
            showLogin();
        }
    });

    function initializeApp(user) {
        showAdminPanel(user);
        listenToStoreStatus();
        listenToAllOrders();
        autoReconnectPrinter();
        setupAdminPanelEventListeners();
    }


    // --- FUNÇÕES DE INTERFACE E AUTENTICAÇÃO ---
    function showAdminPanel(user) {
        loginContainer.classList.add('hidden');
        adminPanel.classList.remove('hidden');
        userEmailDisplay.textContent = user.email;
    }

    function showLogin() {
        adminPanel.classList.add('hidden');
        loginContainer.classList.remove('hidden');
        loginErrorMessage.textContent = '';
        printedOrderIds.clear();
    }

    function setupGlobalEventListeners() {
        loginButton.addEventListener('click', () => {
            const email = loginEmailInput.value;
            const password = loginPasswordInput.value;
            loginErrorMessage.textContent = '';
            if (!email || !password) {
                loginErrorMessage.textContent = 'Preencha e-mail e senha.';
                return;
            }
            auth.signInWithEmailAndPassword(email, password).catch((error) => {
                console.error("Erro no login:", error);
                loginErrorMessage.textContent = 'E-mail ou senha inválidos.';
            });
        });
    }

    function setupAdminPanelEventListeners() {
        logoutButton.addEventListener('click', () => {
            if (bluetoothDevice && bluetoothDevice.gatt.connected) {
                bluetoothDevice.gatt.disconnect();
            }
            auth.signOut();
        });

        userMenuBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            userDropdown.classList.toggle('hidden');
        });

        window.addEventListener('click', () => {
            if (!userDropdown.classList.contains('hidden')) {
                userDropdown.classList.add('hidden');
            }
        });

        storeStatusToggle.addEventListener('change', () => {
            const newStatus = storeStatusToggle.checked ? 'aberta' : 'fechada';
            db.collection('configuracoes').doc('loja').update({
                statusManual: newStatus
            }).catch((error) => {
                console.error("Erro ao atualizar status da loja:", error);
                alert("Houve um erro ao tentar alterar o status da loja. Tente novamente.");
                listenToStoreStatus(); 
            });
        });

        connectPrinterBtn.addEventListener('click', async () => {
            if (bluetoothDevice && bluetoothDevice.gatt.connected) {
                alert('A impressora já está conectada.');
                return;
            }
            try {
                alert('Ligue sua impressora e a mantenha próxima. Na janela que vai abrir, procure por um nome como "MPT-II" e clique em "Parear".');
                const device = await navigator.bluetooth.requestDevice({
                    filters: [{ namePrefix: 'MPT' }],
                    optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb']
                });
                await connectAndSetupPrinter(device);
                alert('Impressora conectada com sucesso!');
            } catch (error) {
                console.error('Erro ao conectar a impressora:', error);
                alert('Falha ao conectar. Detalhe: ' + error.message);
                connectPrinterBtn.classList.remove('connected');
            }
        });

        closePreviewBtn.addEventListener('click', () => {
            printPreviewModal.classList.add('hidden');
            currentOrderToPrint = null;
        });

        confirmPrintBtn.addEventListener('click', async () => {
            if (currentOrderToPrint) {
                const success = await sendTextToPrinter(currentOrderToPrint);
                if (success) {
                    printPreviewModal.classList.add('hidden');
                }
            }
        });
    }


    // --- FUNÇÕES DE DADOS E LÓGICA DE NEGÓCIO ---
    
    // ▼▼▼ FUNÇÃO listenToStoreStatus COM LÓGICA DE AUTOCORREÇÃO ▼▼▼
    function listenToStoreStatus() {
        const storeConfigRef = db.collection('configuracoes').doc('loja');

        storeConfigRef.onSnapshot((doc) => {
            if (doc.exists) {
                // O documento existe, funciona como antes
                const status = doc.data().statusManual;
                const isOpen = status === 'aberta';
                
                storeStatusToggle.disabled = false;
                storeStatusToggle.checked = isOpen;
                storeStatusText.textContent = isOpen ? 'Loja Aberta' : 'Loja Fechada';
                storeStatusText.className = isOpen ? 'open' : 'closed';

            } else {
                // O DOCUMENTO NÃO EXISTE! VAMOS CRIÁ-LO.
                console.warn("Documento de configuração não encontrado. Criando um novo com status 'fechada'.");
                storeStatusText.textContent = 'Configurando...';
                storeStatusToggle.disabled = true;

                // Cria o documento com o valor padrão 'fechada'
                storeConfigRef.set({ statusManual: 'fechada' })
                    .then(() => {
                        console.log("Documento de configuração criado com sucesso!");
                        // A própria chamada onSnapshot será acionada novamente agora que o documento existe,
                        // e o código no bloco 'if (doc.exists)' será executado, corrigindo a interface.
                    })
                    .catch(error => {
                        console.error("Falha crítica ao criar documento de configuração:", error);
                        storeStatusText.textContent = 'Erro Crítico!';
                    });
            }
        }, (error) => {
            console.error("Erro ao escutar status da loja:", error);
            storeStatusText.textContent = 'Erro de Conexão';
            storeStatusToggle.disabled = true;
        });
    }

    function listenToAllOrders() {
        const containers = { 'novo': containerNew, 'em_preparo': containerPrep, 'pronto': containerReady };
        const counts = { 'novo': newOrdersCount, 'em_preparo': prepOrdersCount, 'pronto': readyOrdersCount };
        
        db.collection("pedidos")
          .where("status", "in", ["novo", "em_preparo", "pronto"])
          .orderBy("timestamp", "desc")
          .onSnapshot((snapshot) => {
            
            Object.values(containers).forEach(c => c.innerHTML = '');
            Object.values(counts).forEach(c => c.textContent = '0');
            let statusCounts = { 'novo': 0, 'em_preparo': 0, 'pronto': 0 };

            if (snapshot.empty) {
                containerNew.innerHTML = '<p class="empty-column-message">Nenhum pedido ativo.</p>';
                return;
            }

            snapshot.docChanges().forEach(change => {
                if (change.type === "added") {
                    const doc = change.doc;
                    const orderData = doc.data();
                    if (orderData.status === 'novo' && !printedOrderIds.has(doc.id)) {
                        console.log(`Novo pedido detectado (${doc.id}). Tentando imprimir automaticamente.`);
                        const textToPrint = formatOrderForPrinting(orderData);
                        sendTextToPrinter(textToPrint);
                        printedOrderIds.add(doc.id);
                    }
                }
            });

            snapshot.forEach(doc => {
                const orderData = doc.data();
                const status = orderData.status;
                if (containers[status]) {
                    containers[status].innerHTML += renderOrderCard(doc);
                    statusCounts[status]++;
                }
            });

            Object.keys(statusCounts).forEach(status => {
                counts[status].textContent = statusCounts[status];
                if (statusCounts[status] === 0 && containers[status]) {
                    containers[status].innerHTML = `<p class="empty-column-message">Nenhum pedido ${status.replace('_', ' ')}.</p>`;
                }
            });

        }, (error) => {
            console.error("Erro ao buscar pedidos: ", error);
        });
    }

    async function connectAndSetupPrinter(device) {
        const server = await device.gatt.connect();
        const services = await server.getPrimaryServices();
        let foundCharacteristic = false;
        for (const service of services) {
            const characteristics = await service.getCharacteristics();
            for (const characteristic of characteristics) {
                if (characteristic.properties.write || characteristic.properties.writeWithoutResponse) {
                    printCharacteristic = characteristic;
                    foundCharacteristic = true;
                    break;
                }
            }
            if (foundCharacteristic) break;
        }
        if (!foundCharacteristic) throw new Error("Nenhuma característica de impressão foi encontrada.");
        bluetoothDevice = device;
        connectPrinterBtn.classList.add('connected');
        console.log('Impressora conectada com sucesso!');
        bluetoothDevice.addEventListener('gattserverdisconnected', () => {
            console.log('Impressora desconectada.');
            connectPrinterBtn.classList.remove('connected');
            bluetoothDevice = null;
            printCharacteristic = null;
        });
    }

    async function autoReconnectPrinter() {
        try {
            const permittedDevices = await navigator.bluetooth.getDevices();
            if (permittedDevices.length > 0) {
                const device = permittedDevices[0];
                console.log('Tentando reconectar à impressora:', device.name);
                await connectAndSetupPrinter(device);
            }
        } catch (error) {
            console.error('Falha na reconexão automática:', error);
        }
    }

    async function sendTextToPrinter(text) {
        if (!printCharacteristic) {
            alert('Impressora não está conectada. A impressão automática falhou. Imprima o pedido manualmente.');
            return false;
        }
        try {
            const encoder = new TextEncoder("utf-8");
            const data = encoder.encode(text);
            const chunkSize = 20;
            for (let i = 0; i < data.length; i += chunkSize) {
                const chunk = data.slice(i, i + chunkSize);
                await printCharacteristic.writeValue(chunk);
            }
            return true;
        } catch (error) {
            console.error('Erro ao enviar dados para a impressora:', error);
            alert('Erro ao imprimir. Tente reconectar a impressora.');
            return false;
        }
    }

    function formatOrderForPrinting(orderData) {
        const centralizar = (texto, largura) => {
            const espacos = ' '.repeat(Math.max(0, Math.floor((largura - texto.length) / 2)));
            return espacos + texto;
        };
        const alinhar = (esq, dir, largura) => {
            const espacos = ' '.repeat(Math.max(1, largura - esq.length - dir.length));
            return esq + espacos + dir;
        };
        const LARGURA_CUPOM = 32;
        let cupom = '\n' + centralizar('** PEDIDO **', LARGURA_CUPOM) + '\n\n';
        cupom += `Cliente: ${orderData.clienteNome}\n`;
        cupom += `Data: ${orderData.timestamp.toDate().toLocaleString('pt-BR')}\n`;
        cupom += '-'.repeat(LARGURA_CUPOM) + '\n';
        cupom += `Entrega: ${orderData.endereco}\n`;
        cupom += '-'.repeat(LARGURA_CUPOM) + '\n';
        orderData.itens.forEach(item => {
            const nomeItem = `${item.qtd}x ${item.nome.replace(/^\d+\s*-\s*/, '')}`;
            const precoItem = `R$${(item.qtd * item.precoUnit).toFixed(2)}`;
            cupom += alinhar(nomeItem, precoItem, LARGURA_CUPOM) + '\n';
        });
        cupom += '-'.repeat(LARGURA_CUPOM) + '\n';
        cupom += alinhar('TOTAL:', `R$${orderData.total.toFixed(2)}`, LARGURA_CUPOM) + '\n';
        cupom += `Pagamento: ${orderData.pagamento}\n`;
        if (orderData.pagamento === 'Dinheiro' && orderData.trocoPara) {
             cupom += `Troco para: R$${orderData.trocoPara}\n`;
        }
        cupom += '-'.repeat(LARGURA_CUPOM) + '\n';
        cupom += 'Obs: ' + (orderData.observacoes || 'Nenhuma') + '\n\n\n\n';
        return cupom;
    }

    function renderOrderCard(doc) {
        const orderData = doc.data();
        const orderId = doc.id;
        const status = orderData.status;
        let itemsList = orderData.itens.map(item => `<p>${item.qtd}x ${item.nome}</p>`).join('');
        const orderTime = orderData.timestamp.toDate().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        let actionButtons = '';
        if (status === 'novo') {
            actionButtons = `<button class="action-btn btn-prep" onclick="updateOrderStatus('${orderId}', 'em_preparo')">Preparar</button>`;
        } else if (status === 'em_preparo') {
            actionButtons = `<button class="action-btn btn-ready" onclick="updateOrderStatus('${orderId}', 'pronto')">Pronto</button>`;
        } else if (status === 'pronto') {
            actionButtons = `<button class="action-btn btn-delete" onclick="updateOrderStatus('${orderId}', 'finalizado')">Finalizar</button>`;
        }
        const whatsappLink = `https://api.whatsapp.com/send?phone=${orderData.whatsappLoja}`;
        return `<div class="order-card status-${status}" id="${orderId}"><h4>${orderData.clienteNome}</h4><p><strong>Horário:</strong> ${orderTime}</p><p><strong>Endereço:</strong> ${orderData.endereco || 'Não informado'}</p><p><a href="${whatsappLink}" target="_blank" class="whatsapp-link"><i class="fab fa-whatsapp"></i>Ver no WhatsApp</a></p><hr>${itemsList}<hr><p class="total">Total: R$ ${orderData.total.toFixed(2).replace('.', ',')}</p><div class="card-actions"><button class="action-btn btn-print" onclick="printOrder('${orderId}')">Imprimir</button>${actionButtons}<button class="action-btn btn-delete" onclick="deleteOrder('${orderId}')">Excluir</button></div></div>`;
    }

    // --- AÇÕES GLOBAIS (acessíveis por `onclick`) ---
    window.updateOrderStatus = (orderId, newStatus) => {
        if (!orderId || !newStatus) return;
        db.collection("pedidos").doc(orderId).update({ status: newStatus });
    };

    window.deleteOrder = (orderId) => {
        if (!orderId) return;
        if (confirm("Tem certeza que deseja excluir este pedido?")) {
            db.collection("pedidos").doc(orderId).delete();
        }
    };

    window.printOrder = async (orderId) => {
        try {
            const doc = await db.collection("pedidos").doc(orderId).get();
            if (!doc.exists) {
                alert('Pedido não encontrado.');
                return;
            }
            currentOrderToPrint = formatOrderForPrinting(doc.data());
            printPreviewContent.textContent = currentOrderToPrint;
            printPreviewModal.classList.remove('hidden');
        } catch (error) {
            console.error('Erro ao preparar pré-visualização:', error);
        }
    };

});
/* FIM DO CÓDIGO */
