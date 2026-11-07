# Alterações · 3.0.0-rc1

## Preparação 3.0.0-rc1-feed1

- Prazos e verificação de conexão nas operações Firebase, com rascunhos/IDs preservados.
- Mensagens específicas de rede/permissão/Auth, estado da conexão separado do salvamento local e prevenção de conexões duplicadas.
- Reversão de troca de nick conserva nome e nick locais anteriores.
- Regras RC1 mantidas; testes ampliados de retirada própria, exclusões negadas, privacidade e reversão sem apagar dados.
- Variante Android separada, com destino demo por padrão e exceção HTTP apenas de loopback; APK normal conserva suas proteções.
- Plano de ativação/reversão e evidências em `docs/FEED-CONTROLADO.md`. Produção não alterada.

## Entrega RC1 preservada

- Schema 8 aditivo, cópias prévias e leitura de backups anteriores.
- Cofre IndexedDB imutável por hash; pacote `.brio` com bytes e validação de integridade.
- JSON/metadados até 64 MiB; arquivos até 16 MiB; cofre até 128 MiB; cópias históricas exportáveis separadamente.
- Rascunhos persistentes de publicação/comentários e IDs de operação preservados; confirmação antes de limpar o texto.
- Cliente compat Firebase integrado localmente com autoria, cotas atômicas, consulta limitada, timestamp de servidor e posições imutáveis de comentários. Produção intocada.
- Correções de comentários recebidos como lista e de rascunho recriado indevidamente após confirmação.
- Edição estruturada Feynman/Cornell com versões anteriores.
- Rascunhos EPVT/vieses preservados na recarga, importação e backup imediato, sem salvar o resultado heurístico como fato.
- Edição versionada e recuperação de PARA/cards; preservação do mapa antes de remover nós.
- Grafo indexado, pintura agrupada por quadro, movimentação por teclado e foco preservado.
- Contraste, alvos de interação, foco e refluxo ajustados dentro da identidade Googie/ORBITAL KEYS.
- Exportação Android em blocos, com tamanho conferido antes do seletor.
- Testes de arquivos grandes, falhas, recuperação, interface Firebase e acessibilidade; manual/README atualizados.

Resultados efetivos e validações pendentes: `docs/HOMOLOGACAO-RC1.md`. Evidências das falhas corrigidas foram mantidas.
