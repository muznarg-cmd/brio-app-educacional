# BRIO 3.0 · ORBITAL KEYS · RC1

Preparação posterior do Feed Online: versão de revisão `3.0.0-rc1-feed1`, sem publicação em produção. Consulte [regras exatas, testes e plano de ativação/reversão](docs/FEED-CONTROLADO.md). O pacote de revisão usa `BRIO-Feed-Controlado-v1.git.bundle`; o APK `Somente-Emulador` é separado e fixado no projeto demo. A tag RC1 e seus relatórios abaixo permanecem como referência histórica.

Sistema pessoal de aprendizagem e gestão do conhecimento. Preserva PKM/PARA, Pólya, Feynman, Cornell, Peirce/grafo, EPVT, vieses, flashcards, Pomodoro, notas, feed, perfil/XP e a proposta OCMT. Percursos, diário, laboratório de notícias manual e perguntas socráticas integram os métodos. Sem IA generativa ou API paga.

**Candidata a homologação, sem publicação.** O modo local funciona offline. O Firebase de produção não foi alterado; as regras recebidas estão vencidas. A proposta e o cliente foram testados somente em emuladores demo. Os relatórios anteriores são históricos; consulte [a homologação atual](docs/HOMOLOGACAO-RC1.md).

## 📚 Fundamentação científica e publicação acadêmica

### Arquiteturas Cognitivas Distribuídas na Educação

**Artigo publicado nos Anais do IV Congresso Internacional de Educação SESI-SP (2026).**

**Título:** Arquiteturas Cognitivas Distribuídas na Educação: Proposta de Gestão Cognitiva Otimizada com Tecnologias (OCMT) para a Autonomia Intelectual na Era Algorítmica.

**Autoria:** Camila Souza Rodrigues de Almeida  
**Evento:** IV Congresso Internacional de Educação SESI-SP  
**Publicação:** Anais do IV Congresso Internacional de Educação SESI-SP: Educação que transforma  
**Ano:** 2026  
**Páginas:** 249–261  
**ISSN:** 3086-8580

### Relação entre a OCMT e o BRIO

A Gestão Cognitiva Otimizada com Tecnologias (OCMT) propõe uma arquitetura de mediação cognitiva voltada à organização do conhecimento, à verificação de informações e ao desenvolvimento da autonomia intelectual.

O BRIO é apresentado no artigo como uma materialização tecnológica dessa proposta, articulando:

- Gestão pessoal do conhecimento (PKM) e método PARA;
- Estratégias Procedimentais de Verificação com Tecnologias (EPVT);
- Externalização do pensamento e grafos lógicos;
- Metacognição e revisão crítica;
- Organização da atenção e redução da sobrecarga informacional.

A publicação apresenta os fundamentos e as possibilidades pedagógicas da OCMT. O desenvolvimento e a validação empírica do BRIO permanecem processos distintos e contínuos.

**📖 [Consultar publicação acadêmica oficial](https://anais.eventox.com.br/sesi/congresso-de-internacional-de-educacao-sesi-sp/arquiteturas-cognitivas-distribuidas-na-educacao-proposta-de-gestao-cognitiva-otimizada-com-tecnologias-ocmt-para-a-autonomia-intelectual-na)**

---

## Começar no computador

1. Extraia todo o ZIP. Mantenha `index.html` junto de `assets`.
2. Para experimentar sem ferramentas, abra `index.html` no Edge/Chrome atualizado e use sempre o mesmo caminho e perfil. Para uso frequente, prefira o servidor abaixo.
3. Com Node.js instalado, abra um terminal **nesta pasta** e execute `node scripts/serve.cjs` (ou `npm start`). Abra **http://127.0.0.1:4173**. Ctrl+C encerra o servidor, que atende somente o computador local.
4. Não é necessário instalar dependências para usar a web. Complete a apresentação e abra **Percursos → Novo percurso**. Em Perfil ficam tema, cores, volume, backup e recuperação.

O navegador guarda dados por origem e perfil. `file://`, `localhost`, `127.0.0.1`, outras portas, navegadores e APK têm armazenamentos distintos. Uma tela vazia em outra origem não prova perda na origem anterior. Não há transferência automática.

## Atualizar e guardar seus dados

Exporte o backup e a recuperação **na versão/origem que contém seus dados**, e guarde duas cópias externas. Experimente esta versão em outro perfil, importe uma cópia e confira notas, campos e arquivos. Mesclar conserva versões diferentes e remapeia referências conhecidas; conflitos de campos permanecem em relatório exportável.

Só depois atualize sua pasta de uso, conservando caminho, porta e perfil. O schema 8 arquiva estados anteriores antes da normalização. Reverter código não reverte dados; leitores antigos podem recusar o schema novo. Restaurar estado ativo exige confirmação e mantém uma cópia anterior. Não houve restauração sobre dados reais durante o desenvolvimento.

O botão de exportação gera JSON sem arquivos e **`.brio`** quando precisa incluir bytes. O pacote contém registros e **todo o cofre**, inclusive arquivos preservados de versões/rascunhos. SHA-256 detecta corrupção; não cifra nem comprova autoria. Backups contêm informações privadas.

Limites: 16 MiB por arquivo; 128 MiB no cofre; 64 MiB de JSON/metadados; 224 MiB por pacote. Base64 antigo permanece preservado. Arquivos novos ficam no IndexedDB, fora do JSON principal. Não limpe dados do navegador sem testar um backup externo.

Perfil oferece Arquivos locais, Envios preservados, Lixeira de notas, Registros preservados e Cópias anteriores. Veja o [manual e guia de recuperação](docs/MANUAL-RC1.md).

## Android de teste

O APK separado é **BRIO Teste**, pacote `brio.cognitive.pkm.localtest`, com assinatura debug. A autorização atual cobre apenas emulador isolado. Não houve instalação em aparelho pessoal, migração de dados reais ou publicação em loja.

Para compilar, instale as dependências fixadas de `native/` com `pnpm install --frozen-lockfile --ignore-scripts`, tenha Java 21 e Android SDK e execute `scripts/build-android.ps1` informando `-JavaDirectory` e `-AndroidSdk`. O script sincroniza HTML/assets e mantém cache/chave debug fora da entrega. [Instruções e limites](docs/MANUAL-RC1.md).

## Testes para desenvolvimento

Instale ferramentas gratuitas com `pnpm install --frozen-lockfile --ignore-scripts` (Node 24 usado na validação). Execute `npm test`. Para navegador, prepare Chromium via Playwright ou defina `BRIO_BROWSER_PATH` para Edge/Chrome existente. Execute sequencialmente:

```powershell
npm run test:browser
npm run test:recovery-browser
npm run test:learning-browser
npm run test:preferences-security
npm run test:release-browser
npm run test:accessibility
```

São perfis descartáveis, com serviços externos bloqueados. Para Firebase, instale também as dependências de `security/emulator`, tenha Java 21 e execute `scripts/test-firebase.ps1 -JavaDirectory 'CAMINHO_DO_JDK_21' -Browser`. O script usa somente `demo-brio-security`, em loopback. **Não execute deploy.**

## Documentação e histórico

- [Homologação, testes e pendências](docs/HOMOLOGACAO-RC1.md)
- [Manual, instalação, atualização e recuperação](docs/MANUAL-RC1.md)
- [Arquitetura e schema 8](docs/ARCHITECTURE.md)
- [Segurança Firebase e proposta para revisão](docs/FIREBASE-SECURITY-REVIEW.md)
- [Plano pedagógico anterior à implementação](docs/PLANO-INTEGRACAO-PEDAGOGICA.md)
- [Plano mestre](docs/ROADMAP.md) e [alterações](CHANGELOG.md)

Originais e referências foram mantidos. `node scripts/verify-originals.cjs` confere hashes. Há checkpoints Git e um bundle externo: `git clone BRIO-3.0-RC1.git.bundle brio-historico` recupera o histórico em outra pasta. Evite reset destrutivo sobre sua cópia de uso.
