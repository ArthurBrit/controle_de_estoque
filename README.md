# Controle de Estoque de Cestas

Aplicação local para registrar entradas, retiradas e estornos de cestas, acompanhar indicadores e emitir relatórios mensais. Os dados ficam somente no computador, em SQLite.

## Tecnologias

Next.js, React, TypeScript, SQLite (`better-sqlite3`), Recharts, jsPDF, DOCX e SheetJS.

## Instalação e execução

Requer Node.js 20 ou superior. No Windows, clone o repositório e execute:

```powershell
git clone URL_DO_REPOSITORIO
cd Controle_cestas
npm install
npm run dev
```

Abra `http://localhost:3000`. Para uso diário em modo de produção:

```powershell
npm run build
npm start
```

### Iniciar com dois cliques (Windows)

Clique duas vezes em **`iniciar.bat`** (o antigo `start.bat` continua funcionando). Ele:

- confere se o Node.js 20+ está instalado;
- instala as dependências na primeira vez ou quando o `package-lock.json` mudar;
- gera o build na primeira vez **e sempre que o código for atualizado** (ex.: após um `git pull`);
- inicia o sistema e abre o navegador automaticamente quando ele estiver pronto;
- se o sistema já estiver aberto, apenas abre o navegador.

Mantenha a janela aberta enquanto usar o sistema. Dica: crie um atalho do `iniciar.bat` na Área de Trabalho.

## Configuração do ambiente

O projeto não exige credenciais nem serviços externos. A configuração `DATABASE_PATH` é opcional e permite escolher outro local para o banco SQLite. Sem ela, o sistema usa automaticamente `data/controle-cestas.db`.

Se precisar personalizar esse caminho no desenvolvimento, copie o modelo e edite somente o arquivo local:

```powershell
Copy-Item .env.example .env
```

O `.env` nunca deve ser commitado. Não coloque senhas, tokens ou dados pessoais no `.env.example`.

## Banco de dados e persistência

O banco é criado automaticamente em `data/controle-cestas.db`. Não apague esse arquivo: ele contém o histórico e, portanto, o saldo atual. O diretório `data` é criado automaticamente.

## Backup e restauração

Em **Configurações**, use **Criar backup** para baixar uma cópia `.db`. Em **Restaurar backup**, selecione uma cópia válida e confirme. O sistema preserva o banco anterior como `data/controle-cestas.db.before-restore` e passa a usar os dados restaurados imediatamente.

## Levar para outro computador

1. Clone o projeto e execute `npm install`.
2. Copie o backup para o novo computador.
3. Inicie o sistema e use **Configurações → Restaurar backup**; reinicie o sistema.

Alternativamente, com o sistema fechado, copie `data/controle-cestas.db` diretamente para a mesma pasta no novo computador.

## Publicação segura

O repositório não deve conter bancos SQLite, backups, variáveis locais, logs, dependências ou artefatos de build. Antes de publicar alterações, confira:

```powershell
git status
git diff --cached
npm audit --omit=dev
npm run build
```

Movimentações podem conter nomes, destinos e observações. Nunca force a inclusão de arquivos da pasta `data` no Git. Consulte também [SECURITY.md](SECURITY.md).

## Dados de demonstração

O sistema começa vazio para uso real. Para testar, registre uma entrada de 10, duas retiradas (2 e 1) e outra entrada de 5; o saldo esperado será 12. Esses registros podem ser estornados pelo histórico, preservando a auditoria.

## Testes

Os testes automáticos (`tests/`) usam um banco temporário e exigem Node.js 22.18 ou superior.

```powershell
npm test
npm run build
```
