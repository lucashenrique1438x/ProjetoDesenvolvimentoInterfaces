
# Localizador de Saúde e Medicamentos (DataSUS)

Projeto desenvolvido por alunos do curso de **Engenharia de Software do CEUB**. A aplicação visa facilitar a localização de serviços de saúde e farmácias populares por região, melhorando o acesso da população a atendimentos e medicamentos essenciais.

## 1. O que é?
Uma ferramenta web de busca e visualização de pontos de atendimento médico, clínicas e dispensação de medicamentos em tempo real.

* **Quando usar:** Para encontrar atendimento ou medicamentos em regiões específicas de forma rápida.
* **Por que:** Melhora o acesso à informação pública, centraliza dados do DataSUS e evita deslocamentos desnecessários.
* **Público-alvo:** Cidadãos em geral, profissionais de saúde e gestores públicos.

> **Nota Técnica:** Devido a restrições de CORS da API pública do DataSUS no navegador, o projeto utiliza uma arquitetura com um servidor Proxy local em C# para intermediar as requisições com segurança.

---

## 2. Como Rodar Localmente

Para rodar a aplicação, você precisará iniciar o **Servidor Proxy (C#)** e o **Servidor Frontend (Python)** simultaneamente.

### Pré-requisitos
* **Python 3.x** ([Download](https://www.python.org/downloads/))
* **.NET SDK 6.0+** ([Download](https://dotnet.microsoft.com/download))

### Passo 1: Iniciar o Proxy (C#)
1. Abra o terminal na pasta do backend (`ProxyDataSUS`).
2. Execute o comando:
```bash
   dotnet run

```

*O proxy rodará em `http://localhost:5000`.*

### Passo 2: Iniciar o Frontend (Python)

1. Abra um **novo terminal** na pasta raiz do projeto (onde está o `index.html`).
2. Execute o comando:

```bash
   python -m http.server 8080

```

*O frontend rodará em `http://localhost:8080`.*

### Passo 3: Acessar a Aplicação

1. Abra o navegador em: [http://localhost:8080](http://localhost:8080)
2. Digite o município, selecione a UF e clique em **Pesquisar** para renderizar os marcadores no mapa.
