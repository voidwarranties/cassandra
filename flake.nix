{
  description = "Cassandra - Artificial life form";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-24.05";
    flake-utils.url = "github:numtide/flake-utils";
    devshell = {
      url = "github:numtide/devshell";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = {
    self,
    nixpkgs,
    flake-utils,
    devshell,
  }:
    flake-utils.lib.eachDefaultSystem (
      system: let
        pkgs = import nixpkgs {
          inherit system;
          overlays = [devshell.overlays.default];
        };
      in {
        formatter = pkgs.alejandra;
        devShells.default = pkgs.devshell.mkShell {
          name = "Cassandra devshell";
          packages = [
            pkgs.nodePackages.prettier
            pkgs.nodejs
          ];
          commands = [
            {
              name = "deploy";
              help = "Deploy Cassandra using Docker";
              command = ''
                docker-compose -H ssh://voidwarranties up -d
              '';
            }
            {
              name = "shutdown";
              help = "Shut down Cassandra using Docker";
              command = ''
                docker-compose -H ssh://voidwarranties down
              '';
            }
            {
              name = "logs";
              help = "Tail Cassandra logs";
              command = ''
                docker-compose -H ssh://voidwarranties logs -f
              '';
            }
          ];
        };
      }
    );
}
