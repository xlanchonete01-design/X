// ==================================================================================
// ARQUIVO DE CONFIGURAÇÃO DO CARDÁPIO DIGITAL
// ==================================================================================
const CONFIG = {

    // --- 1. INFORMAÇÕES GERAIS DA LOJA ---
    nomeLoja: "Isabela Lanches",
    subtitulo: "O Sabor que Conquista!",
    urlImagemCapa: "https://i.postimg.cc/44LYxx5K/Design-sem-nome-1.png",
    urlLogoCircular: "https://i.postimg.cc/Px4BFGT8/Isabela-Lanches.png",

    // --- 2. CONTATO E ENTREGA ---
    telefoneWhatsapp: "5519995027183", // Coloque seu número com código do país e DDD
    taxaEntrega: 5.00,

    // --- 3. HORÁRIOS DE FUNCIONAMENTO ---
    // Dias: 0=Domingo, 1=Segunda, 2=Terça, 3=Quarta, 4=Quinta, 5=Sexta, 6=Sábado
    horariosFuncionamento: [
        { dia: 0, abre: "00:01", fecha: "23:00" }, // Domingo
        // Segunda é fechado (linha comentada)
        { dia: 2, abre: "00:02", fecha: "00:00" }, // Terça-feira
        { dia: 3, abre: "00:01", fecha: "00:00" }, // Quarta-feira
        { dia: 4, abre: "00:01", fecha: "00:00" }, // Quinta-feira
        { dia: 5, abre: "00:01", fecha: "00:00" }, // Sexta-feira
        { dia: 6, abre: "00:01", fecha: "00:00" }  // Sábado
    ],

    // --- 4. CARDÁPIO / MENU ---
    cardapio: [
        {
            categoria: "Hambúrguer Artesanal",
            itens: [
                { nome: "01 - X Bacon", descricao: "Hambúrguer Artesanal, Bacon, queijo, tomate, alface e cebola.", preco: 28.00, imagem: "https://i.postimg.cc/1zqyDRPV/images-1.jpg" },
                { nome: "02 - X Burger", descricao: "Hambúrguer Artesanal e Queijo", preco: 19.00, imagem: "https://i.postimg.cc/7LvF838M/x-burguer.jpg" },
                { nome: "03 - X Egg", descricao: "Hambúrguer Artesanal, ovo, queijo, alface, tomate e cebola.", preco: 23.00, imagem: "https://i.postimg.cc/wB6kmMDf/images-2.jpg" },
                { nome: "04 - X Salada", descricao: "Hambúrguer Artesanal, queijo, alface, tomate e cebola.", preco: 21.00, imagem: "https://i.postimg.cc/tJh56xv3/images-3.jpg" },
                { nome: "05 - X Tudo", descricao: "Hambúrguer Artesanal, queijo, presunto, bacon, ovo, milho, alface, tomate e cebola.", preco: 32.00, imagem: "https://i.postimg.cc/7hxCBJZq/images-4.jpg" }
            ]
        },
        {
            categoria: "Bebidas",
            itens: [
                { nome: "Coca-Cola Lata", descricao: "350ml", preco: 6.00, imagem: "" },
                { nome: "Guaraná Antártica 1L", descricao: "1 Litro", preco: 7.00, imagem: "" }
            ]
        },
        {
            categoria: "Adicionais",
            itens: [
                { nome: "Bacon", descricao: "Fatias de bacon crocante.", preco: 4.00, categoriasPermitidas: ["Hambúrguer Artesanal"], imagem: "https://i.postimg.cc/P5fgtXPG/ai-generated-cooked-bacon-slices-free-png.png" },
                { nome: "Ovo", descricao: "Ovo frito na chapa.", preco: 3.00, categoriasPermitidas: ["Hambúrguer Artesanal"], imagem: "https://i.postimg.cc/wMfhLQc4/depositphotos-8237037-stock-photo-fried-egg-in-a-griddle.webp" }
            ]
        }
    ],

    // --- 5. INFORMAÇÕES DE CONTATO E REDES SOCIAIS ---
    informacoesLoja: {
        endereco: "Rua da Conquista, 123 - Bairro Vitória, Cidade - SP",
        horario: "Atendimento: Terça a Domingo, das 18:00 às 23:00",
        instagram: "https://www.instagram.com/seu_usuario",
        facebook: "https://www.facebook.com/sua_pagina",
        whatsapp: `https://api.whatsapp.com/send?phone=5519995027183`,
        chavePix: "seu-email-ou-telefone@pix.com.br" 
    }
};
