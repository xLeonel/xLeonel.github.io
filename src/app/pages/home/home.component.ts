import { Component, OnInit, ViewChild } from '@angular/core';
import { AlertService } from '../../services/alert.service';
import { AulaService } from '../../services/aula.service';
import { TipoUser, User } from '../../models/user';
import { AccountService } from '../../services/account.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Materia } from '../../models/materia';
import { BarcodeFormat } from '@zxing/library';
import { ZXingScannerComponent } from '@zxing/ngx-scanner';
import { Aula } from 'src/app/models/aula';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  private aulas!: Aula[];

  materias: Materia[] = [];
  user!: User;
  form!: FormGroup;
  loading = false;
  submitted = false;
  exibirQRCode = false;
  aulaAtual = false;

  @ViewChild('scanner')
  scanner: ZXingScannerComponent = new ZXingScannerComponent();

  hasCameras = false;
  hasPermission!: boolean;
  qrResultString!: string;
  formatoQRCode = [BarcodeFormat.QR_CODE];
  valueQRCode = '';

  get isAluno() {
    return this.user.tipoUsuario === TipoUser.aluno;
  }

  get isProfessor() {
    return this.user.tipoUsuario === TipoUser.professor;
  }

  //get form fields
  get formulario() { return this.form.controls; }


  constructor(private accountService: AccountService,
    private aulasService: AulaService,
    private alertService: AlertService,
    private formBuilder: FormBuilder) {
    this.accountService.user.subscribe(x => this.user = x);
  }

  ngOnInit(): void {
    if (this.isProfessor) {
      this.aulasService.getAllByProfessor(this.user.id).subscribe({
        next: aulas => {
          this.aulas = aulas;
          this.ValidarAula();
        },
        error: e => {
          this.alertService.error(e);
        }
      });


      this.form = this.formBuilder.group({
        dateFim: ['', [Validators.required]],
        curso: ['', [Validators.required]],
        materia: ['', [Validators.required]]
      });
    }

    if (this.isAluno) {
      this.InicializarEventosScanner();
    }
  }

  private ValidarAula() {
    let horaAtual = new Date(Date.now()).toLocaleString();

    const aulaAtual = this.aulas.find(a => new Date(a.inicio).toLocaleString() >= horaAtual && new Date(a.fim).toLocaleString() <= horaAtual)
    console.log(aulaAtual)

    if (aulaAtual) {
      this.aulaAtual = true;
    }
    else {
      this.aulaAtual = false;
    }
  }

  private InicializarEventosScanner() {
    this.scanner.camerasFound.subscribe((devices: MediaDeviceInfo[]) => {
      this.hasCameras = true;
    });

    // this.scanner.camerasNotFound.subscribe((devices: MediaDeviceInfo[]) => {
    //   console.error('An error has occurred when trying to enumerate your video-stream-enabled devices.');
    // });

    this.scanner.permissionResponse.subscribe((answer: boolean) => {
      this.hasPermission = answer;
    });
  }

  criarAula(): void {
    if (this.isProfessor) {
      this.submitted = true;

      this.alertService.clear();

      if (this.form.invalid) {
        return;
      }

      let horaInicio = new Date(Date.now());

      let horasMinutos = <string>this.formulario['dateFim'].value;

      let horaFim = new Date(Date.now());
      horaFim.setHours(parseInt(horasMinutos.split(':')[0]));
      horaFim.setMinutes(parseInt(horasMinutos.split(':')[1]));

      if (horaFim <= horaInicio) {
        this.alertService.error('Digite uma hora maior que a hora atual');
        return;
      }

      this.loading = true;

      let aula = new Aula(0, this.user, this.formulario['curso'].value, this.formulario['materia'].value, horaInicio, horaFim, [])

      this.aulasService.register(aula).subscribe({
        next: () => {
          this.exibirQRCode = true;
        },
        error: e => {
          this.alertService.error(e);
          this.loading = false;
        }
      });
    }
  }

  PreencherMaterias(event: any) {
    this.materias = this.user.curso.find(c => c.id === parseInt(event.target.value))!.materias;
  }

  lerQRCode(resultString: string) {
    console.log('Result: ', resultString);
    this.qrResultString = resultString;
  }

}



