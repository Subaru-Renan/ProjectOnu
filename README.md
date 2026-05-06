# 🌐 ONU — Árvore Interativa de Nações

## Descrição

Aplicação web em **Python (Flask)** que consome a **REST Countries API** e organiza ~250 países do mundo em uma estrutura de árvore hierárquica na memória, com interface visual interativa completa.

## Estrutura da Árvore

```
🌐 ONU (raiz)
└── Continente       (campo: region)
    └── Região       (campo: subregion)
        └── País     (folha — com bandeira, capital, população, área)
```

## API Utilizada

**REST Countries** → `https://restcountries.com/v3.1/all`  
Campos: `name`, `region`, `subregion`, `flags`, `population`, `area`, `capital`, `cca3`

## Funcionalidades Implementadas

| Funcionalidade | Descrição |
|---|---|
| **Caminhamentos** | Pré-ordem, Em-ordem, Pós-ordem com animação visual |
| **Busca DFS** | Depth-First Search com destaque do caminho raiz→país |
| **Busca BFS** | Breadth-First Search alternativa, selecionável no header |
| **Inserção Local** | Adiciona país em qualquer continente/região existente |
| **Exclusão Local** | Remove país com confirmação, mantendo referências íntegras |
| **Métricas em tempo real** | Altura e Grau de cada nó via tooltip e badge ao hover |
| **Bandeiras** | SVG da REST Countries API em cada país |
| **Caminho (path)** | Exibe `ONU → Continente → Região → País` ao clicar |

## Estrutura de Arquivos

```
onu_v2/
├── app.py                  # Backend Flask (rotas + lógica da árvore)
├── templates/
│   └── index.html          # HTML base (usa url_for para CSS/JS)
├── static/
│   ├── css/
│   │   └── style.css       # Estilos (tema dark ONU)
│   └── js/
│       └── main.js         # Lógica da árvore (traversals, busca, insert, delete)
├── standalone.html         # Versão sem Flask — abre direto no browser
└── README.md
```

## Como Executar (Flask)

```bash
pip install flask requests
python app.py
# Acesse: http://localhost:5000
```

## Como Executar (Standalone)

Basta abrir `standalone.html` num servidor local (ou use Live Server no VS Code).  
A página busca a API diretamente do browser.
