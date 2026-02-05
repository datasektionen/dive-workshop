job "dive-workshop" {
  type = "service"

  group "dive-workshop" {
    network {
      port "http" { }
    }

    service {
      name     = "dive-workshop"
      port     = "http"
      provider = "nomad"
      tags = [
        "traefik.enable=true",
        "traefik.http.routers.dive-workshop.rule=Host(`dive.datasektionen.se`)",
        "traefik.http.routers.dive-workshop.tls.certresolver=default",
      ]
    }

    task "dive-workshop" {
      driver = "docker"

      config {
        image = var.image_tag
        ports = ["http"]
      }

      template {
        data        = <<ENV
{{ with nomadVar "nomad/jobs/dive-workshop" }}
DATABASE_URL=postgresql://dive:{{ .database_password }}@postgres.dsekt.internal:5432/dive
{{ end }}
PORT={{ env "NOMAD_PORT_http" }}
NODE_ENV=production
ENV
        destination = "local/.env"
        env         = true
      }

      resources {
        memory = 256
      }
    }
  }
}

variable "image_tag" {
  type = string
  default = "ghcr.io/datasektionen/dive-workshop:latest"
}