{
  description = "Cassandra - Artificial life form";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-23.11";
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
        devShells = rec {
          default = cassandra-devshell;
          cassandra-devshell = pkgs.devshell.mkShell {
            name = "Cassandra development environment";
            packages = [
              pkgs.nodePackages.prettier
              pkgs.nodejs
            ];
          };
        };
      }
    );
}
