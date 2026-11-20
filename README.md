# Linha do tempo do Dante

Site da família com a história do Dante, do primeiro ultrassom até hoje.

- **Computador:** Rio da vida, uma linha horizontal com polaroids que balançam, inclinam em 3D e abrem em tela cheia.
- **Celular:** Álbum de capítulos por idade, com modo histórias.
- **Fotos:** ficam no Google Drive da família (etapa 2). Por enquanto o app usa momentos de exemplo em `src/lib/sample.ts`.

## Rodar

```bash
npm install
npm run dev
```

Abra http://localhost:3000. Para forçar um modo: `?modo=rio` ou `?modo=album`.

## Configurar

Datas e nome ficam em `src/config.ts` (os valores atuais são de exemplo).

## Atalhos no Rio da vida

| Tecla | O que faz |
| --- | --- |
| Roda do mouse, arrastar, setas | andar pela linha |
| Ctrl + roda, `+` e `-` | zoom |
| `M` / `Shift+M` | próximo / anterior marco |
| `F` | modo filme |
| `Home` / `End` | início / hoje |
| Na foto aberta: setas, `L`, `Esc` | trocar, curtir, fechar |

## Etapas

1. Visual e interações com dados de exemplo (este código)
2. Sincronizar com a pasta do Google Drive
3. Login e família
4. Modo filme com música, comparar fotos, filtros por pessoa
