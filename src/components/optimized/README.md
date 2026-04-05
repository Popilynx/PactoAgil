# Componentes Otimizados

Esta pasta contém versões otimizadas de componentes que podem substituir
os componentes originais para melhorar performance.

## Componentes Disponíveis

### CategoryList
Lista de categorias memoizada com virtualização para grandes listas.

### OptimizedFieldExtractor
Versão otimizada do extrator de campos com:
- React.memo para evitar re-renders
- useMemo para agrupamento de campos
- useCallback para handlers

## Como Usar

1. Importar o componente otimizado:
```typescript
import { OptimizedFieldExtractor } from '@/components/optimized';
```

2. Substituir o componente original no JSX

3. Verificar no React DevTools se os re-renders foram reduzidos

## Checklist de Otimização

- [ ] Componentes exportados com memo()
- [ ] Props primitivos quando possível (string, number, boolean)
- [ ] useCallback para funções passadas a children
- [ ] useMemo para cálculos derivados
- [ ] Lazy loading para componentes abaixo da dobra
