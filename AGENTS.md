# AGENTS.md

## Meta-regra — gestão de arquivos de configuração

### Arquivos que você NUNCA deve editar sem permissão explícita:
- `AGENTS.md` (este arquivo)
- `.mimocode/mimocode.json`

### Arquivos que você PODE e DEVE manter atualizados:
- `MEMORY.md` — atualiza com decisões e aprendizados do projeto
- `specs/**/*.md` — cria e atualiza durante o workflow de features

---

## Documentação de bibliotecas — OBRIGATÓRIO

SEMPRE que for escrever, sugerir ou revisar código que envolva qualquer
biblioteca ou framework externo, você DEVE usar as ferramentas do Context7
MCP antes de responder:

1. `resolve-library-id` — para encontrar o ID da biblioteca
2. `query-docs` — para buscar a documentação atualizada

Nunca use o que está no seu training data para APIs externas.
O training data pode estar desatualizado. A documentação real vem do Context7.

Exemplos de quando usar:
- "Como configuro middleware no Fastify?" → busca no mcp Context7 antes de responder
- "Cria um componente React com useEffect" → busca no mcp Context7 antes de responder
- "Gera uma migration com Prisma" → busca no mcp Context7 antes de responder

---

## Organização e modularização — OBRIGATÓRIO

Nunca escreva código monolítico. Sempre separe por responsabilidade:

- Cada arquivo tem uma única responsabilidade clara
- Funções gigantes devem ser quebradas se o arquivo estiver extenso
- Lógica de negócio separada de I/O (banco, HTTP, filesystem)
- Componentes/módulos reutilizáveis extraídos para pastas próprias
- Imports organizados: externos → internos → relativos

Antes de implementar qualquer coisa, pergunte:
"Esse código pertence aqui ou deveria estar em um módulo separado?"

---

## Workflow de features — OBRIGATÓRIO

Quando solicitado a criar uma feature, ferramenta ou projeto novo,
siga esta ordem sem pular etapas:

1. Crie `specs/<nome>/requirements.md` com:
   - Objetivo da feature
   - User stories: "Como [persona], quero [ação] para [benefício]"
   - Critérios de aceitação

2. Crie `specs/<nome>/design.md` com:
   - Decisões de arquitetura e trade-offs
   - Diagrama de fluxo em mermaid
   - Interfaces e tipos principais

3. Crie `specs/<nome>/tasks.md` com:
   - Checklist executável ordenado por dependência
   - Cada task deve ser atômica e verificável

4. Aguarde aprovação explícita antes de implementar qualquer código

---

## Stack do projeto
- (preencha: linguagem, framework, banco, libs principais)

## Padrões de código
- (preencha: convenções, estrutura de pastas, nomenclatura)