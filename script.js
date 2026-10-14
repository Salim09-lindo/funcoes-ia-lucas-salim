// Elementos do DOM
const formPergunta = document.querySelector("#form-pergunta");
const inputPergunta = document.querySelector("#input-pergunta");

const loader = document.querySelector("#loader");
const caixaResultados = document.querySelector("#caixa-resultados");
const textoResultado = document.querySelector("#texto-resultado");

const noticiaContainer = document.querySelector("#noticia-container");
const tituloNoticia = document.querySelector("#titulo-noticia");

const btnOuvir = document.querySelector("#btn-ouvir");
const btnPararVoz = document.querySelector("#btn-parar-voz");
const btnCopiar = document.querySelector("#btn-copiar");
const labelCopiar = document.querySelector("#label-copiar");
const btnNovaBusca = document.querySelector("#btn-nova-busca");

let synth = window.speechSynthesis;
let utterance = null;

// Realiza a busca diretamente no DuckDuckGo (API de respostas diretas) sem abrir abas
async function buscarNoDuckDuckGo(termo) {
    pararVoz();
    caixaResultados.classList.add("oculto");
    loader.classList.remove("oculto");

    try {
        // Proxy/Endpoint da API DuckDuckGo para dados instantâneos em JSON
        const endpoint = `https://api.duckduckgo.com/?q=${encodeURIComponent(termo + " futebol")}&format=json&no_html=1&skip_disambig=1`;
        
        const resposta = await fetch(endpoint);
        const dados = await resposta.json();

        let conteudo = "";
        let fonte = "";

        if (dados.AbstractText && dados.AbstractText.trim().length > 0) {
            conteudo = dados.AbstractText;
            fonte = dados.Heading || "DuckDuckGo Instant Answer";
        } else if (dados.RelatedTopics && dados.RelatedTopics.length > 0) {
            // Filtra os tópicos retornados sem abrir novas abas
            const resultadosValidos = dados.RelatedTopics
                .filter(item => item.Text)
                .slice(0, 3)
                .map(item => `• ${item.Text}`)
                .join("\n\n");

            if (resultadosValidos) {
                conteudo = resultadosValidos;
                fonte = "Resultados da Pesquisa DuckDuckGo";
            }
        }

        // Se o DuckDuckGo não retornar texto direto, fazemos o fallback com API pública complementar
        if (!conteudo) {
            conteudo = await buscarFallbackWikipedia(termo);
            fonte = "Base de Conhecimento Esportivo";
        }

        exibirResultado(conteudo, fonte);
    } catch (erro) {
        console.error("Erro de conexão na busca:", erro);
        exibirResultado(
            "Não foi possível obter a resposta em tempo real no momento. Verifique sua conexão com a internet e tente novamente.",
            "Erro de Conexão"
        );
    } finally {
        loader.classList.add("oculto");
    }
}

// Fallback complementar diretamente no script caso a pergunta necessite de resumo direto
async function buscarFallbackWikipedia(termo) {
    try {
        const urlWiki = `https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(termo)}`;
        const res = await fetch(urlWiki);
        if (res.ok) {
            const data = await res.json();
            if (data.extract) {
                return data.extract;
            }
        }
    } catch (e) {
        console.log("Fallback indisponível");
    }
    return `Informações para "${termo}": Não foram encontrados resumos diretos sobre este termo específico. Tente reformular sua pergunta utilizando palavras-chave como o nome do time, jogador ou campeonato.`;
}

// Exibe a resposta obtida na própria página
function exibirResultado(texto, nomeFonte) {
    textoResultado.textContent = texto;

    if (nomeFonte) {
        noticiaContainer.classList.remove("oculto");
        tituloNoticia.textContent = `Fonte: ${nomeFonte}`;
    } else {
        noticiaContainer.classList.add("oculto");
    }

    caixaResultados.classList.remove("oculto");
}

// Submissão do Formulário
formPergunta.addEventListener("submit", (e) => {
    e.preventDefault();
    const pergunta = inputPergunta.value.trim();
    if (pergunta) {
        buscarNoDuckDuckGo(pergunta);
    }
});

// Controle de Leitura de Voz por I.A
function falarTexto(texto) {
    if ('speechSynthesis' in window) {
        pararVoz();

        utterance = new SpeechSynthesisUtterance(texto);
        utterance.lang = 'pt-BR';
        utterance.rate = 1.0;

        utterance.onstart = () => {
            btnOuvir.classList.add("oculto");
            btnPararVoz.classList.remove("oculto");
        };

        utterance.onend = () => {
            btnOuvir.classList.remove("oculto");
            btnPararVoz.classList.add("oculto");
        };

        synth.speak(utterance);
    } else {
        alert("Seu navegador não possui suporte para leitura de voz.");
    }
}

function pararVoz() {
    if (synth && synth.speaking) {
        synth.cancel();
    }
    btnOuvir.classList.remove("oculto");
    btnPararVoz.classList.add("oculto");
}

btnOuvir.addEventListener("click", () => {
    falarTexto(textoResultado.textContent);
});

btnPararVoz.addEventListener("click", pararVoz);

// Função do Botão Copiar
btnCopiar.addEventListener("click", () => {
    const texto = textoResultado.textContent;
    navigator.clipboard.writeText(texto).then(() => {
        labelCopiar.textContent = "Copiado!";
        setTimeout(() => {
            labelCopiar.textContent = "Copiar";
        }, 2000);
    }).catch(err => {
        console.error("Erro ao copiar texto: ", err);
    });
});

// Reiniciar Busca
btnNovaBusca.addEventListener("click", () => {
    pararVoz();
    caixaResultados.classList.add("oculto");
    inputPergunta.value = "";
    inputPergunta.focus();
});