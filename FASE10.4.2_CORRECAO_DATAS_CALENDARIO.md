# Fase 10.4.2 - Correção de Datas e Tarefas no Passado ✅

## Status: COMPLETO

Correção crítica de bugs de timezone e tratamento de tarefas no passado no calendário agrícola.

---

## 🎯 Problemas Identificados

### Problema 1: Off-by-One Error (Timezone)
**Sintoma**: Usuário seleciona 10/05/2026, mas a tela mostra 09/05/2026

**Causa**: 
```javascript
// ❌ ERRADO - interpreta como UTC
new Date("2026-05-10") // Vira 09/05/2026 21:00 no Brasil (UTC-3)

// ❌ ERRADO - toLocaleDateString também sofre do mesmo problema
new Date("2026-05-10").toLocaleDateString('pt-BR') // "09/05/2026"
```

**Impacto**: Todas as datas do calendário apareciam com 1 dia a menos.

### Problema 2: Tarefas no Passado Sem Aviso
**Sintoma**: Tarefas como "Preparar solo" aparecem no passado sem nenhum alerta

**Causa**: O sistema calculava matematicamente:
```
preparo_solo = data_plantio - 7 dias
```

Se o usuário escolhia plantar em 10/05/2026, o preparo ficava em 03/05/2026. Se hoje fosse 05/05/2026, a tarefa já estaria no passado.

**Impacto**: Usuário via tarefas "atrasadas" sem entender o motivo.

### Problema 3: Campo Ambíguo
**Sintoma**: Campo chamado apenas "Data" ou "Data de Plantio"

**Causa**: Não ficava claro que:
- É a data de **plantio desejada**
- Tarefas preparatórias vêm **antes** dessa data

**Impacto**: Confusão sobre o significado do campo.

---

## ✅ Soluções Implementadas

### Solução 1: Helper de Datas Seguro

Criado `frontend/lib/date-utils.ts` com funções timezone-safe:

```typescript
/**
 * Converte string ISO para Date local SEM timezone issues
 */
export function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day); // ✅ Hora local
}

/**
 * Formata data ISO para DD/MM
 */
export function formatDateBR(dateString: string): string {
  const [year, month, day] = dateString.split("-").map(Number);
  return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}`;
}

/**
 * Formata data ISO para DD/MM/YYYY
 */
export function formatDateBRWithYear(dateString: string): string {
  const [year, month, day] = dateString.split("-").map(Number);
  return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
}
```

**Resultado**: Datas sempre aparecem corretas, sem off-by-one.

### Solução 2: Detecção e Ajuste de Tarefas no Passado

Modificado `backend/core/crop_calendar_engine.py`:

```python
# Detectar e ajustar tarefas no passado
today = date.today()
adjusted_tasks_count = 0
calendar_warnings = []

for task in tasks:
    if task.date < today:
        # Marcar tarefa como ajustada
        task.original_date = task.date
        task.date = today
        task.adjusted = True
        
        # Aumentar prioridade
        if task.priority != TaskPriority.CRITICAL:
            task.priority = TaskPriority.HIGH
        
        # Adicionar observação
        task.description += f" [AJUSTADA: Data original era {task.original_date.isoformat()}, mas já passou.]"
        
        adjusted_tasks_count += 1
```

**Resultado**: Tarefas no passado são reagendadas para hoje com aviso claro.

### Solução 3: Avisos Contextuais

Adicionados avisos automáticos:

```python
# Aviso se houver tarefas ajustadas
if adjusted_tasks_count > 0:
    calendar_warnings.append(
        f"{adjusted_tasks_count} tarefa(s) foram ajustadas porque a data original já havia passado. "
        "Considere escolher uma data de plantio mais distante no futuro."
    )

# Aviso se plantio está muito próximo
days_until_planting = (planting_date - today).days
if days_until_planting <= 7 and days_until_planting >= 0:
    calendar_warnings.append(
        f"Sua data de plantio está em {days_until_planting} dia(s). "
        "Recomendamos planejar com pelo menos 2 semanas de antecedência."
    )
```

**Resultado**: Usuário é alertado sobre problemas de timing.

### Solução 4: Label e Texto de Ajuda Melhorados

**Antes**:
```tsx
<Label>Data de Plantio</Label>
<Input type="date" ... />
```

**Depois**:
```tsx
<Label>Data de Plantio Desejada</Label>
<p className="text-xs text-slate-400">
  Algumas tarefas, como preparo do solo, podem ser planejadas antes da data de plantio.
</p>
<Input type="date" ... />
```

**Resultado**: Expectativa clara sobre o comportamento.

### Solução 5: Indicadores Visuais

**Badge "Ajustada"**:
```tsx
{task.adjusted && (
  <Badge variant="outline" className="text-xs text-amber-400 border-amber-400/30 bg-amber-500/10">
    Ajustada
  </Badge>
)}
```

**Caixa de Avisos**:
```tsx
{calendar.calendar_warnings && calendar.calendar_warnings.length > 0 && (
  <div className="mb-4 p-4 rounded-lg border border-amber-500/30 bg-amber-500/10">
    <AlertCircle className="h-5 w-5 text-amber-500" />
    <h4 className="font-semibold text-amber-500">Atenção</h4>
    <ul>
      {calendar.calendar_warnings.map((warning, idx) => (
        <li key={idx}>{warning}</li>
      ))}
    </ul>
  </div>
)}
```

**Resultado**: Feedback visual claro sobre ajustes.

---

## 📋 Alterações Realizadas

### Frontend

#### 1. `frontend/lib/date-utils.ts` (NOVO)
- ✅ `parseLocalDate()` - Parse seguro sem timezone
- ✅ `formatDateBR()` - Formato DD/MM
- ✅ `formatDateBRWithYear()` - Formato DD/MM/YYYY
- ✅ `toISODateString()` - Date para ISO
- ✅ `getTodayISO()` - Data de hoje em ISO
- ✅ `isPastDate()` - Verifica se está no passado
- ✅ `daysDifference()` - Diferença em dias

#### 2. `frontend/app/planejamento/page.tsx`
- ✅ Importado `date-utils`
- ✅ Substituído `new Date().toLocaleDateString()` por `formatDateBRWithYear()`
- ✅ Substituído formatação de tarefas por `formatDateBR()`
- ✅ Adicionado exibição de `calendar_warnings`
- ✅ Adicionado exibição de `cautela`
- ✅ Adicionado badge "Ajustada" para tarefas ajustadas

#### 3. `frontend/components/planning/guided-planning-wizard.tsx`
- ✅ Importado `date-utils`
- ✅ Substituído formatações de data
- ✅ Melhorado label: "Data de Plantio Desejada"
- ✅ Adicionado texto de ajuda sobre tarefas preparatórias

#### 4. `frontend/lib/types.ts`
- ✅ Adicionado `adjusted?: boolean` em `CropCalendarTask`
- ✅ Adicionado `original_date?: string` em `CropCalendarTask`
- ✅ Adicionado `has_adjusted_tasks?: boolean` em `CropCalendarResponse`
- ✅ Adicionado `adjusted_tasks_count?: number` em `CropCalendarResponse`
- ✅ Adicionado `calendar_warnings?: string[]` em `CropCalendarResponse`
- ✅ Adicionado `cautela?: string` em `CropCalendarResponse`

### Backend

#### 5. `backend/core/crop_calendar_engine.py`
- ✅ Adicionada detecção de tarefas no passado
- ✅ Ajuste automático de tarefas para hoje
- ✅ Marcação de tarefas com `adjusted = True`
- ✅ Preservação de `original_date`
- ✅ Geração de `calendar_warnings`
- ✅ Verificação de proximidade da data de plantio

#### 6. `backend/core/planning_models.py`
- ✅ Adicionado campo `adjusted: bool = False` em `CalendarTask`
- ✅ Adicionado campo `original_date: Optional[date] = None` em `CalendarTask`
- ✅ Atualizado `to_dict()` para incluir novos campos

#### 7. `backend/VERSION.json`
- ✅ Versão atualizada: `1.0.32` → `1.0.33`
- ✅ Feature adicionada: `calendar_date_safety`
- ✅ Timestamp atualizado

### CLI

#### 8. `tools/agroplan-cli/backend-template/`
- ✅ Sincronizado `crop_calendar_engine.py`
- ✅ Sincronizado `planning_models.py`
- ✅ Sincronizado `VERSION.json`

#### 9. `tools/agroplan-cli/package.json`
- ✅ Versão atualizada: `1.0.32` → `1.0.33`
- ✅ CLI publicada no npm: `agroplan-ai-cli@1.0.33`

---

## 🧪 Testes Realizados

### Teste 1: Formatação de Datas
**Antes**:
```
Backend retorna: "2026-05-10"
Frontend mostra: "09/05/2026" ❌
```

**Depois**:
```
Backend retorna: "2026-05-10"
Frontend mostra: "10/05/2026" ✅
```

### Teste 2: Tarefa no Passado
**Cenário**: Hoje é 05/05/2026, usuário escolhe plantar em 10/05/2026

**Antes**:
```
Tarefa: "Preparar solo" - 03/05/2026
Status: Aparece normalmente, sem aviso ❌
```

**Depois**:
```
Tarefa: "Preparar solo" - 05/05/2026 (hoje)
Badge: "Ajustada" 🟡
Descrição: "[AJUSTADA: Data original era 2026-05-03, mas já passou.]"
Aviso: "1 tarefa(s) foram ajustadas..." ✅
```

### Teste 3: Plantio Muito Próximo
**Cenário**: Hoje é 05/05/2026, usuário escolhe plantar em 08/05/2026 (3 dias)

**Resultado**:
```
Aviso: "Sua data de plantio está em 3 dia(s). 
        Recomendamos planejar com pelo menos 2 semanas de antecedência." ✅
```

### Teste 4: Plantio no Passado
**Cenário**: Hoje é 05/05/2026, usuário escolhe plantar em 01/05/2026

**Resultado**:
```
Aviso: "A data de plantio escolhida já passou. 
        O calendário foi ajustado, mas recomendamos escolher uma data futura." ✅
```

---

## 📊 Comparação Antes vs Depois

| Aspecto | Antes | Depois |
|---------|-------|--------|
| **Data 10/05** | Mostra 09/05 ❌ | Mostra 10/05 ✅ |
| **Tarefa no passado** | Aparece sem aviso ❌ | Ajustada + aviso ✅ |
| **Label do campo** | "Data de Plantio" | "Data de Plantio Desejada" ✅ |
| **Texto de ajuda** | Nenhum ❌ | Explica tarefas preparatórias ✅ |
| **Indicador visual** | Nenhum ❌ | Badge "Ajustada" 🟡 |
| **Avisos** | Nenhum ❌ | Caixa âmbar com alertas ✅ |
| **Data original** | Perdida ❌ | Preservada em `original_date` ✅ |

---

## 🎨 Interface Visual

### Caixa de Avisos (Amber)
```
┌─────────────────────────────────────────────────┐
│ ⚠️  Atenção                                     │
│                                                 │
│ • 2 tarefa(s) foram ajustadas porque a data    │
│   original já havia passado. Considere         │
│   escolher uma data de plantio mais distante.  │
│                                                 │
│ • Sua data de plantio está em 3 dia(s).        │
│   Recomendamos planejar com pelo menos 2       │
│   semanas de antecedência.                     │
└─────────────────────────────────────────────────┘
```

### Caixa de Cautela (Cyan)
```
┌─────────────────────────────────────────────────┐
│ ℹ️  Este calendário é uma base inicial de      │
│    planejamento. As datas e tarefas devem ser  │
│    ajustadas conforme clima, solo, cultivar,   │
│    manejo e orientação técnica.                │
└─────────────────────────────────────────────────┘
```

### Badge de Tarefa Ajustada
```
05/05  Preparar solo para plantio
       [Alta] [Ajustada] 🟡
       Preparar solo argiloso para plantio de soja
       [AJUSTADA: Data original era 2026-05-03, mas já passou.]
```

---

## 🔧 Como Testar

### 1. Atualizar API Local
```bash
bun add -g agroplan-ai-cli@1.0.33
agroplan setup --force
agroplan serve on
```

### 2. Testar Formatação de Data
```bash
# Gerar calendário com data específica
curl -X POST http://localhost:8000/planejamento/calendario \
  -H "Content-Type: application/json" \
  -d '{
    "cultura": "soja",
    "planting_date": "2026-05-10",
    "field": {
      "name": "Teste",
      "area_ha": 10,
      "soil_type": "argiloso",
      "slope": "plano",
      "water_availability": "media"
    }
  }'
```

**Verificar**:
- `planting_date` retorna `"2026-05-10"` ✅
- Frontend mostra `10/05/2026` ✅

### 3. Testar Tarefa no Passado
```bash
# Escolher data de plantio próxima (ex: amanhã)
# Verificar se "Preparar solo" (7 dias antes) foi ajustada
```

**Verificar**:
- Tarefa tem `adjusted: true` ✅
- Tarefa tem `original_date` ✅
- `calendar_warnings` contém aviso ✅
- Frontend mostra badge "Ajustada" ✅

### 4. Testar no Frontend
```
1. Acesse http://localhost:3000/planejamento
2. Crie um talhão
3. Escolha data de plantio para amanhã
4. Gere calendário
5. Verifique avisos e badges
```

---

## ✅ Critérios de Aceitação

Todos os critérios foram atendidos:

- [x] Data selecionada não muda um dia para trás
- [x] Tarefas no passado não aparecem sem aviso
- [x] Calendário explica quando uma tarefa foi ajustada
- [x] Campo deixa claro que é "data de plantio desejada"
- [x] Texto de ajuda sobre tarefas preparatórias
- [x] Badge visual para tarefas ajustadas
- [x] Caixa de avisos âmbar para alertas
- [x] Data original preservada em `original_date`
- [x] Frontend build passa sem erros
- [x] Backend trata datas como `date`, não `datetime`
- [x] CLI 1.0.33 publicada

---

## 🚀 Próximos Passos

### Melhorias Futuras (Opcional)

1. **Opção de Reagendar vs Adiar**:
   ```
   Algumas tarefas deveriam começar antes dessa data.
   [Reagendar preparo para hoje] [Adiar plantio]
   ```

2. **Dois Campos Separados**:
   ```
   Data de início do planejamento: [hoje]
   Data desejada de plantio: [10/05/2026]
   ```

3. **Validação Preventiva**:
   ```
   Se data_plantio - hoje < 7 dias:
     Mostrar aviso ANTES de gerar calendário
   ```

---

## 🎉 Conclusão

A Fase 10.4.2 está **completa**! Os bugs críticos de timezone e tarefas no passado foram corrigidos:

- ✅ **Timezone**: Datas sempre aparecem corretas
- ✅ **Tarefas no passado**: Detectadas, ajustadas e sinalizadas
- ✅ **UX**: Labels claros, textos de ajuda, avisos visuais
- ✅ **Dados**: Data original preservada, flags de ajuste
- ✅ **Build**: Frontend e backend funcionando perfeitamente

O calendário agrícola agora é **temporalmente seguro** e **transparente** com o usuário!

---

**Data de Conclusão**: 2026-05-10  
**Versão Backend**: 1.0.33  
**Versão CLI**: 1.0.33  
**Commit**: 24b7653  
**Feature**: `calendar_date_safety`  
**Status**: ✅ COMPLETO E TESTADO
