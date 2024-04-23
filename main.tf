# Setup terraform
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.16"
    }
  }
  required_version = ">= 1.2.0"
}

# Setup region
provider "aws" {
  region = "us-east-1"
}

# Create a VPC
resource "aws_vpc" "my_vpc" {
  cidr_block       = "10.0.0.0/16"
  instance_tenancy = "default"
  tags = {
    Name = "MyVPC"
  }
}

# Create a subnet
resource "aws_subnet" "pub_subnet" {
  vpc_id     = aws_vpc.my_vpc.id
  cidr_block = "10.0.1.0/24"
  tags = {
    Name = "My public subnet"
  }
}

# Create an internet gateway
resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.my_vpc.id
  tags = {
    Name = "My IGW"
  }
}

# Create a route table
resource "aws_route_table" "pub_rt" {
  vpc_id = aws_vpc.my_vpc.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }
}

# Associate the route table with the subnet
resource "aws_route_table_association" "pub_rt_association" {
  subnet_id      = aws_subnet.pub_subnet.id
  route_table_id = aws_route_table.pub_rt.id
}

# Create a security group
resource "aws_security_group" "my_group" {
  name        = "security group using Terraform"
  description = "security group using Terraform"
  vpc_id      = aws_vpc.my_vpc.id

  ingress {
    description      = "HTTPS"
    from_port        = 443
    to_port          = 443
    protocol         = "tcp"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }

  ingress {
    description      = "HTTP"
    from_port        = 80
    to_port          = 80
    protocol         = "tcp"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }

  ingress {
    description      = "SSH"
    from_port        = 22
    to_port          = 22
    protocol         = "tcp"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }

  ingress {
    description      = "frontend"
    from_port        = 8080
    to_port          = 8080
    protocol         = "tcp"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }

  ingress {
    description      = "backend"
    from_port        = 3000
    to_port          = 3000
    protocol         = "tcp"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }

  egress {
    from_port        = 0
    to_port          = 0
    protocol         = "-1"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }
}

# Change the permissions of the key pair
resource "null_resource" "change_key_permissions" {
  provisioner "local-exec" {
    command = "chmod 400 ${var.key_name}"
  }
  # This resource depends on the key pair being created
  triggers = {
    key_name = aws_key_pair.key_pair.key_name
  }
}

# Create a key pair
resource "tls_private_key" "rsa_4096" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

variable "key_name" {
  description = "Name of the SSH key pair"
  default     = "key_ssh.pem"
}

resource "aws_key_pair" "key_pair" {
  key_name   = var.key_name
  public_key = tls_private_key.rsa_4096.public_key_openssh
}

resource "local_file" "private_key" {
  content  = tls_private_key.rsa_4096.private_key_pem
  filename = var.key_name
}

# Create an EC2 instance
resource "aws_instance" "app_server" {
  ami                         = "ami-0c101f26f147fa7fd"
  instance_type               = "t2.micro"
  subnet_id                   = aws_subnet.pub_subnet.id
  vpc_security_group_ids      = [aws_security_group.my_group.id]
  associate_public_ip_address = true
  key_name                    = aws_key_pair.key_pair.key_name

  tags = {
    Name = "TTTApp"
  }

  connection {
    type        = "ssh"
    user        = "ec2-user"
    private_key = file(var.key_name)
    host        = self.public_ip
  }

  provisioner "remote-exec" {
    inline = [
      "sudo yum update -y",
      "sudo yum install -y docker",
      "sudo usermod -aG docker $${USER}",
      "sudo systemctl start docker",
      "sudo systemctl enable docker",
      "sudo curl -L https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m) -o /usr/local/bin/docker-compose",
      "sudo chmod +x /usr/local/bin/docker-compose",
      "sudo yum install -y git",
      "sudo git clone https://github.com/DBorner/PWr-PwCh.git",
      "echo 'API_URL=\"http://${self.public_ip}:3000/api\"' | sudo tee PWr-PwCh/frontend/.env.local",
      "echo 'SOCKET_URL=\"http://${self.public_ip}:3000\"' | sudo tee -a PWr-PwCh/frontend/.env.local",
      "echo 'COGNITO_USER_POOL_ID=' | sudo tee PWr-PwCh/backend/.env",
      "echo 'COGNITO_CLIENT_ID=' | sudo tee -a PWr-PwCh/backend/.env",
      "cd PWr-PwCh",
      "sudo docker-compose up --detach"
    ]
  }
}

# Output the public IP of the instance
output "instance_public_ip" {
  value = aws_instance.app_server.public_ip
}