// app.component.ts
import { Component } from '@angular/core';
import { JsonTreeViewerComponent } from './json-tree-viewer/json-tree-viewer.component';

@Component({
  selector: 'app-root',
  template: `
    <div class="container">
      <app-json-tree-viewer [jsonData]="myJson"></app-json-tree-viewer>
    </div>
  `,
  styles: [`
    .container {
      height: 100vh;
      width: 100%;
      padding: 20px;
      box-sizing: border-box;
      background: #1e1e1e;
    }
  `],
  standalone: true,
  imports: [JsonTreeViewerComponent]
})
export class AppComponent {
  myJson = {
    "recebiveis": [{
      "cnpjCredenciadora": "09089356000118",
      "cpfCnpjOriginador": "1047826363643",
      "arranjo": "VCC",
      "datas": [{
        "idExternoUr": "RU_VCC_1047826363643_2022_01_21",
        "idUr": "8c1aae87-af7b-91d5-1bf0-5a43258d1c10",
        "dataPrevistaLiquidacao": "2022-01-21",
        "valorConstituidoTotal": 5000,
        "valorConstituidoPreContratado": 0,
        "liquidacoes": []
      }]
    }]
  };
}
